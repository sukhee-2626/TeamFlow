import { WorkspaceMember, WorkspaceRole } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, User, UserMinus } from "lucide-react";

interface MembersListProps {
  members: WorkspaceMember[];
  currentUserId: string;
  isManager: boolean;
  onUpdateRole: (memberId: string, role: WorkspaceRole) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MembersList({ 
  members, 
  currentUserId, 
  isManager, 
  onUpdateRole, 
  onRemoveMember 
}: MembersListProps) {
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {getInitials(member.profile?.name || null, member.profile?.email || null)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {member.profile?.name || member.profile?.email || 'Unknown User'}
                {member.user_id === currentUserId && (
                  <span className="text-muted-foreground ml-2">(You)</span>
                )}
              </p>
              {member.profile?.email && member.profile?.name && (
                <p className="text-sm text-muted-foreground">{member.profile.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={member.role === 'manager' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {member.role === 'manager' ? (
                <Shield className="h-3 w-3 mr-1" />
              ) : (
                <User className="h-3 w-3 mr-1" />
              )}
              {member.role}
            </Badge>

            {isManager && member.user_id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onUpdateRole(member.id, member.role === 'manager' ? 'worker' : 'manager')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Make {member.role === 'manager' ? 'Worker' : 'Manager'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRemoveMember(member.id)}
                    className="text-destructive"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove from workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
