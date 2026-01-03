import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header";
import ProjectShowcase from "@/components/ProjectShowcase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { QrCode, LayoutDashboard, LogIn } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl space-y-6 mb-12">
          <h2 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground leading-tight">
            Generate <span className="text-primary">Dynamic QR Codes</span> with Ease
          </h2>
          <p className="text-xl text-muted-foreground mt-4">
            Create, customize, and track your QR codes for various content types. Perfect for marketing, events, and personal use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {!loading && !user ? (
              <Button 
                size="lg" 
                onClick={() => navigate('/login')} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-xl shadow-lg"
              >
                <LogIn className="w-5 h-5 mr-3" /> Get Started - It's Free!
              </Button>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/studio')} 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-xl shadow-lg"
                >
                  <QrCode className="w-5 h-5 mr-3" /> Go to QR Studio
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')} 
                  className="border-primary text-primary hover:bg-primary/10 text-lg px-8 py-6 rounded-xl shadow-lg"
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" /> View Dashboard
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
      <ProjectShowcase />
      <MadeWithDyad />
    </div>
  );
};

export default Index;