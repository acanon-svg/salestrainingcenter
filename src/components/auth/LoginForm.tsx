import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import addiTrainingLogo from "@/assets/addi-training-logo.svg";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";

export const LoginForm: React.FC = () => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { getSetting, isLoading: settingsLoading } = useAppSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fullName, setFullName] = useState("");

  const registrationEnabled = getSetting("registration_enabled", false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signInWithEmail(email, password);
    setIsLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUpWithEmail(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted via-background to-muted">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <img 
              src={addiTrainingLogo} 
              alt="Addi Training Center" 
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground">Training Center</h1>
            <p className="text-muted-foreground mt-2">
              Plataforma de entrenamiento corporativo
            </p>
          </div>

          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Bienvenido</CardTitle>
              <CardDescription>
                Inicia sesión con tu cuenta corporativa @addi.com
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email/Password Form */}
              {registrationEnabled ? (
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="register">Registrarse</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-4">
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Correo electrónico</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="tu.nombre@addi.com"
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
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="w-full text-sm text-primary hover:underline mt-2"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-4">
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Nombre completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="Tu nombre"
                            className="pl-10 h-11"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Correo electrónico</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="tu.nombre@addi.com"
                            className="pl-10 h-11"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Contraseña</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="register-password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="pl-10 h-11"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
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
                          "Crear Cuenta"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  {/* Login only - no registration */}
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="tu.nombre@addi.com"
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
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-sm text-primary hover:underline mt-2"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </>
              )}

              {/* Domain restriction notice */}
              <p className="text-xs text-center text-muted-foreground">
                Solo usuarios con correo @addi.com pueden acceder
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-muted-foreground">
          2026 - Todos los derechos reservados
        </p>
      </footer>

      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </div>
  );
};