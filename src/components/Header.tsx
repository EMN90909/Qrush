import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, Plan } from '@/context/AuthContext';
import { LogIn, LogOut, Crown, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PlanBadge: React.FC<{ plan: Plan }> = ({ plan }) => {
  let colorClass = '';
  let text = '';
  let Icon = User;

  switch (plan) {
    case 'guest':
      colorClass = 'bg-gray-200 text-gray-800';
      text = 'Guest';
      Icon = User;
      break;
    case 'free':
      colorClass = 'bg-blue-100 text-blue-800';
      text = 'Free User';
      Icon = User;
      break;
    case 'paid':
      colorClass = 'bg-yellow-100 text-yellow-800';
      text = 'Paid Pro';
      Icon = Crown;
      break;
  }

  return (
    <span className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \${colorClass}\`}>
      <Icon className="w-4 h-4 mr-1" />
      {text}
    </span>
  );
};

const Header: React.FC = () => {
  const { user, plan, signIn, signOut } = useAuth();

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-primary">QR Dyad</h1>
        
        <div className="flex items-center space-x-4">
          <PlanBadge plan={plan} />

          {plan === 'guest' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" /> Sign In / Up
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Simulate Sign In</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signIn('free')}>
                  Sign In (Free Plan)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signIn('paid')}>
                  Sign In (Paid Plan)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={signOut} className="flex items-center">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;