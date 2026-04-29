import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import addiTrainingLogo from "@/assets/addi-training-logo.svg";

const ALLOWED_EMAIL = "acanon@addi.com";
const NEW_URL = "https://salestrainingcenterv2-pi.vercel.app/";

export const LoginForm: React.FC = () => {
  const { signInWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      toast({
        title: "Acceso restringido",
        description: "Esta plataforma se ha movido. Por favor usa el nuevo enlace.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    await signInWithEmail(email.trim().toLowerCase(), password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted via-background to-muted">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <img
              src={addiTrainingLogo}
              alt="Addi Training Center"
              className="h-20 mx-auto mb-6"
            />
            <h1 className="text-4xl font-bold text-foreground">Training Center</h1>
          </div>

          {/* Migration Notice with Addi brand */}
          <Card className="shadow-2xl border-border/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-addi-cyan to-addi-orange" />
            <CardHeader className="text-center pb-3 pt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-gradient">Training Center se muda</span>
              </CardTitle>
              <CardDescription className="text-base mt-3 px-2">
                Ahora estaremos en un nuevo hogar. Visítanos en el siguiente enlace para continuar con tu entrenamiento:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <a
                href={NEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-addi-blue-light hover:opacity-90 transition-opacity shadow-lg"
                >
                  Ir al nuevo Training Center
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <div className="text-center">
                <p className="text-xs text-muted-foreground break-all">
                  {NEW_URL}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hidden admin login trigger */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowLogin((v) => !v)}
              aria-label="Acceso administrador"
              className="w-3 h-3 rounded-full bg-muted-foreground/10 hover:bg-muted-foreground/30 transition-colors"
            />
          </div>

          {showLogin && (
            <Card className="mt-6 shadow-md border-border/50 animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Acceso restringido</CardTitle>
                <CardDescription className="text-xs">
                  Solo para administración interna.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="usuario@addi.com"
                        className="pl-10 h-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Addi Training Center · Todos los derechos reservados · Creado por Alexandra Cañon
        </p>
      </footer>
    </div>
  );
};
