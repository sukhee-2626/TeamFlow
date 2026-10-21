import { appUserReconnectRequired, callAsAppUser } from "../_shared/appUserConnector.ts";
import { getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
import { corsHeaders, jsonHeaders } from "../_shared/cors.ts";
import { getAuthedUser } from "../_shared/authUser.ts";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "notion";
const NOTION_VERSION = "2025-09-03";
const DATABASE_TITLE = "FlowDesk Personal Tasks";
const PARENT_PAGE_TITLE = "FlowDesk";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  scheduled_at: string | null;
};

function notionHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "Notion-Version": NOTION_VERSION };
}

function taskProperties(t: TaskRow) {
  return {
    Name: { title: [{ text: { content: t.title } }] },
    Status: {
      select: { name: t.status === "completed" ? "Done" : t.status === "ongoing" ? "In progress" : "To do" },
    },
    Priority: { select: { name: t.priority || "medium" } },
    Deadline: { date: t.deadline ? { start: t.deadline } : null },
    Scheduled: { date: t.scheduled_at ? { start: t.scheduled_at } : null },
    Description: { rich_text: t.description ? [{ text: { content: t.description } }] : [] },
    Completed: { checkbox: t.status === "completed" },
    "Task ID": { rich_text: [{ text: { content: t.id } }] },
  };
}

// Find the "FlowDesk Personal Tasks" data source, creating the parent page
// and database on first sync. Returns the data source id rows live in.
async function findOrCreateDataSource(connectionAPIKey: string): Promise<string> {
  const search = async (filterObject: string) => {
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: "/v1/search",
      init: {
        method: "POST",
        headers: notionHeaders(),
        body: JSON.stringify({ query: DATABASE_TITLE, filter: { property: "object", value: filterObject } }),
      },
    });
    if (!res.ok) {
      throw new Error(`Notion search failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    return (await res.json()).results ?? [];
  };

  let results = await search("data_source");
  if (results.length > 0) return results[0].id;

  // Older databases created via the legacy API show up as "database" objects.
  results = await search("database");
  if (results.length > 0) {
    const dbRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: `/v1/databases/${results[0].id}`,
      init: { headers: notionHeaders() },
    });
    if (!dbRes.ok) {
      throw new Error(`Notion database lookup failed (${dbRes.status}): ${(await dbRes.text()).slice(0, 300)}`);
    }
    const db = await dbRes.json();
    const dsId = db.data_sources?.[0]?.id;
    if (dsId) return dsId;
  }

  // Find or create the FlowDesk parent page at the workspace root.
  let parentPageId: string | undefined;
  const pageRes = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: CONNECTOR_ID,
    path: "/v1/search",
    init: {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({ query: PARENT_PAGE_TITLE, filter: { property: "object", value: "page" } }),
    },
  });
  if (pageRes.ok) {
    const pageData = await pageRes.json();
    const root = (pageData.results ?? []).find((p: { parent?: { type?: string } }) =>
      p.parent?.type === "workspace"
    );
    if (root) parentPageId = root.id;
  }
  if (!parentPageId) {
    const createRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: "/v1/pages",
      init: {
        method: "POST",
        headers: notionHeaders(),
        body: JSON.stringify({
          parent: { type: "workspace", workspace: true },
          properties: { title: { title: [{ text: { content: PARENT_PAGE_TITLE } }] } },
        }),
      },
    });
    if (!createRes.ok) {
      throw new Error(`Notion page creation failed (${createRes.status}): ${(await createRes.text()).slice(0, 300)}`);
    }
    parentPageId = (await createRes.json()).id;
  }

  const createDbRes = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: CONNECTOR_ID,
    path: "/v1/databases",
    init: {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        parent: { type: "page_id", page_id: parentPageId },
        title: [{ type: "text", text: { content: DATABASE_TITLE } }],
        properties: {
          Name: { title: {} },
          Status: { select: {} },
          Priority: { select: {} },
          Deadline: { date: {} },
          Scheduled: { date: {} },
          Description: { rich_text: {} },
          Completed: { checkbox: {} },
          "Task ID": { rich_text: {} },
        },
      }),
    },
  });
  if (!createDbRes.ok) {
    throw new Error(
      `Notion database creation failed (${createDbRes.status}): ${(await createDbRes.text()).slice(0, 300)}`,
    );
  }
  const db = await createDbRes.json();
  const dsId = db.data_sources?.[0]?.id;
  if (!dsId) throw new Error("Notion database was created but returned no data source");
  return dsId;
}

// Map FlowDesk task id -> Notion page id, using the "Task ID" property.
async function loadExistingRows(connectionAPIKey: string, dataSourceId: string) {
  const map: Record<string, string> = {};
  let startCursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: `/v1/data_sources/${dataSourceId}/query`,
      init: { method: "POST", headers: notionHeaders(), body: JSON.stringify(body) },
    });
    if (!res.ok) {
      throw new Error(`Notion query failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const data = await res.json();
    for (const page of data.results ?? []) {
      const taskId = page.properties?.["Task ID"]?.rich_text?.[0]?.plain_text;
      if (taskId) map[taskId] = page.id;
    }
    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }
  return map;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user, supabase } = await getAuthedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: jsonHeaders() });
    }

    const connectionAPIKey = await getConnectionKeyForUser(user.id, CONNECTOR_ID);
    if (!connectionAPIKey) {
      return Response.json({ connected: false }, { headers: jsonHeaders() });
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from("personal_tasks")
      .select("id,title,description,status,priority,deadline,scheduled_at")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    if (tasksError) {
      return Response.json({ error: tasksError.message }, { status: 500, headers: jsonHeaders() });
    }
    const tasks: TaskRow[] = tasksData ?? [];

    const dataSourceId = await findOrCreateDataSource(connectionAPIKey);
    const existing = await loadExistingRows(connectionAPIKey, dataSourceId);

    let created = 0;
    let updated = 0;
    for (const t of tasks) {
      const props = taskProperties(t);
      const pageId = existing[t.id];
      const res = pageId
        ? await callAsAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey,
          connectorId: CONNECTOR_ID,
          path: `/v1/pages/${pageId}`,
          init: { method: "PATCH", headers: notionHeaders(), body: JSON.stringify({ properties: props }) },
        })
        : await callAsAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey,
          connectorId: CONNECTOR_ID,
          path: "/v1/pages",
          init: {
            method: "POST",
            headers: notionHeaders(),
            body: JSON.stringify({
              parent: { type: "data_source_id", data_source_id: dataSourceId },
              properties: props,
            }),
          },
        });
      if (!res.ok) {
        throw new Error(`Notion task write failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      }
      if (pageId) updated++;
      else created++;
    }

    // Archive Notion rows whose task no longer exists in FlowDesk.
    const appTaskIds = new Set(tasks.map((t) => t.id));
    let archived = 0;
    for (const [taskId, pageId] of Object.entries(existing)) {
      if (appTaskIds.has(taskId)) continue;
      const res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey,
        connectorId: CONNECTOR_ID,
        path: `/v1/pages/${pageId}`,
        init: { method: "PATCH", headers: notionHeaders(), body: JSON.stringify({ archived: true }) },
      });
      if (res.ok) archived++;
    }

    return Response.json({ connected: true, created, updated, archived }, { headers: jsonHeaders() });
  } catch (err) {
    console.error("notion-sync failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Notion sync failed" },
      { status: 500, headers: jsonHeaders() },
    );
  }
});
