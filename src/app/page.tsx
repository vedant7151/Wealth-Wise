import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Camera, Shield, Zap, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-6 lg:px-8 h-16 flex items-center border-b border-border/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Zap className="h-6 w-6 text-emerald-500" />
          <span className="font-bold text-xl tracking-tight">Wealth</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-emerald-400 transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-emerald-400 transition-colors" href="#testimonials">
            Feedback
          </Link>
          <Link href="/dashboard">
            <Button className="bg-emerald-500 hover:bg-emerald-600 px-6">Login</Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 lg:py-32 xl:py-48 flex justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute top-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]"></div>
          
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl/none bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-transparent bg-clip-text">
                  Master Your Money with AI.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed">
                  Automate receipt scanning with Google Gemini, analyze spending, and build a brighter financial future without the manual tracking.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-10 text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-full transition-all hover:scale-105">
                    Start Tracking
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything you need to succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Powerful tools paired with cutting-edge AI to automate your finances.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-full">
                    <Camera className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold">AI Receipt Scanner</h3>
                  <p className="text-muted-foreground">Upload any receipt and let Gemini AI instantly extract the amount, date, category, and merchant.</p>
                </CardContent>
              </Card>
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-full">
                    <LineChart className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold">Dynamic Dashboards</h3>
                  <p className="text-muted-foreground">Visualize your cash flow with beautiful Recharts, custom timeframes, and advanced tagging filters.</p>
                </CardContent>
              </Card>
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-full">
                    <Shield className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold">Bank-Grade Security</h3>
                  <p className="text-muted-foreground">Protected by Clerk authentication, Supabase RLS, and Arcjet advanced bot protection algorithms.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section id="testimonials" className="w-full py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-center mb-12">What our users say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-emerald-500 text-emerald-500" />)}
                  </div>
                  <p className="text-muted-foreground">"The AI receipt scanner is basically magic. It caught itemized numbers that I would have totally messed up manually."</p>
                  <div>
                    <p className="font-semibold">Sarah Jenkins</p>
                    <p className="text-sm text-emerald-500">Freelance Designer</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-emerald-500 text-emerald-500" />)}
                  </div>
                  <p className="text-muted-foreground">"Setting monthly budgets and getting an instant dashboard breakdown literally solved my overspending habit in 3 weeks."</p>
                  <div>
                    <p className="font-semibold">Michael Chen</p>
                    <p className="text-sm text-emerald-500">Software Engineer</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-emerald-500 text-emerald-500" />)}
                  </div>
                  <p className="text-muted-foreground">"Wealth tracking across my personal and professional accounts is seamless. The switch functionality is brilliant."</p>
                  <div>
                    <p className="font-semibold">Elena Rodriguez</p>
                    <p className="text-sm text-emerald-500">Small Business Owner</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t border-border/50 bg-background py-8">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-500" />
            <span className="font-bold">Wealth</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm text-center md:text-left">
            Built for the modern financial era. Empowered by cutting-edge AI.
          </p>
          <div className="flex gap-4">
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">Terms</Link>
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">Privacy</Link>
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
