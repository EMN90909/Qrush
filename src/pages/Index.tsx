import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header";
import ProjectShowcase from "@/components/ProjectShowcase";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the QR Studio page
    navigate('/studio');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
            Loading QR Studio...
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            You will be redirected shortly.
          </p>
        </div>
      </main>
      <ProjectShowcase />
      <MadeWithDyad />
    </div>
  );
};

export default Index;