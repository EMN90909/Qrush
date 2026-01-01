import { MadeWithDyad } from "@/components/made-with-dyad";
import Header from "@/components/Header";
import QRCodeGenerator from "@/components/QRCodeGenerator";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
            Generate Your QR Codes Instantly
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            Static, Dynamic, and Customizable QR solutions for every plan.
          </p>
        </div>
        <QRCodeGenerator />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;