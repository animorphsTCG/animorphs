
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Database, Users, Music, Gamepad2, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminProps {
  user: any;
}

const Admin = ({ user }: AdminProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Simple admin check - in production this would be more sophisticated
  const isAdmin = user.eos_id === 'admin' || user.id === 1;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-black/20 border-white/10 text-white max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">You don't have permission to access this area.</p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminActions = [
    {
      title: "Database Management",
      description: "View and manage database tables, run migrations",
      icon: Database,
      color: "from-blue-600 to-purple-600",
      actions: ["View Users", "Manage Cards", "Run Migrations", "Database Backup"]
    },
    {
      title: "User Management",
      description: "Manage user accounts, Battle Pass subscriptions",
      icon: Users,
      color: "from-green-600 to-blue-600",
      actions: ["View All Users", "Grant Battle Pass", "Ban/Unban Users", "Reset Passwords"]
    },
    {
      title: "Music Library",
      description: "Manage music files and user selections",
      icon: Music,
      color: "from-purple-600 to-pink-600",
      actions: ["Scan Music Files", "Update Metadata", "View User Playlists", "Add New Songs"]
    },
    {
      title: "Battle System",
      description: "Monitor battles and adjust game balance",
      icon: Gamepad2,
      color: "from-red-600 to-orange-600",
      actions: ["View Active Battles", "Battle Statistics", "Adjust Card Stats", "Tournament Management"]
    },
    {
      title: "Payment System",
      description: "Monitor transactions and YoCo integration",
      icon: CreditCard,
      color: "from-yellow-600 to-red-600",
      actions: ["View Transactions", "Process Refunds", "Update Pricing", "YoCo Webhook Status"]
    }
  ];

  const handleAdminAction = async (category: string, action: string) => {
    setIsLoading(true);
    
    try {
      // TODO: Implement actual admin API calls
      console.log(`Admin action: ${category} - ${action}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Admin Action",
        description: `${action} completed successfully`,
      });
    } catch (error) {
      toast({
        title: "Admin Action Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Admin Welcome */}
        <Card className="bg-black/20 border-white/10 text-white mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, Administrator</CardTitle>
            <CardDescription className="text-gray-300">
              Manage all aspects of the Animorphs TCG platform
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Admin Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminActions.map((section) => (
            <Card key={section.title} className="bg-black/20 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <section.icon className="h-6 w-6 text-blue-400" />
                  <span>{section.title}</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.actions.map((action) => (
                    <Button
                      key={action}
                      onClick={() => handleAdminAction(section.title, action)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-white border-white/20 hover:bg-white/10"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Status */}
        <Card className="bg-black/20 border-white/10 text-white mt-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">Online</div>
                <div className="text-sm text-gray-300">API Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">Connected</div>
                <div className="text-sm text-gray-300">Database</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">Active</div>
                <div className="text-sm text-gray-300">EOS Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">Running</div>
                <div className="text-sm text-gray-300">YoCo Payments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-black/20 border-white/10 text-white mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                Emergency Stop
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Restart Services
              </Button>
              <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                Send Announcement
              </Button>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
