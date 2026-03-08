import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Leaf } from 'lucide-react';
import { z } from 'zod';
import { PasswordInput } from '@/components/auth/PasswordInput';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getLoginErrorMessage = (errorMessage: string): string => {
    if (errorMessage === 'Invalid login credentials') return 'Incorrect email or password. Please try again.';
    if (errorMessage.includes('Email not confirmed')) return 'Please verify your email address before signing in. Check your inbox for a confirmation link.';
    if (errorMessage.includes('Too many requests')) return 'Too many login attempts. Please wait a moment and try again.';
    return 'Something went wrong. Please try again.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(loginEmail); passwordSchema.parse(loginPassword); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' }); return; }
    }
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) { toast({ title: 'Login Failed', description: getLoginErrorMessage(error.message), variant: 'destructive' }); }
    else { if (rememberMe) localStorage.setItem('agrotrust_remember_me', 'true'); toast({ title: 'Welcome back!' }); navigate('/'); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try { nameSchema.parse(signupName); emailSchema.parse(signupEmail); passwordSchema.parse(signupPassword); } catch (err) {
      if (err instanceof z.ZodError) { toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' }); return; }
    }
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);
    if (error) {
      toast({ title: error.message.includes('already registered') ? 'Account Exists' : 'Signup Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account Created!', description: 'Please check your email to verify your account.' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4"><Leaf className="h-10 w-10 text-primary" /><span className="text-3xl font-bold text-primary">AgroTrust</span></div>
          <p className="text-muted-foreground">Connect directly with verified Nigerian farmers</p>
        </div>
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center"><CardTitle>Welcome</CardTitle><CardDescription>Sign in or create an account</CardDescription></CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Login</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2"><Label htmlFor="login-email">Email</Label><Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="login-password">Password</Label><PasswordInput id="login-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></div>
                  <div className="flex items-center space-x-2"><Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c as boolean)} /><Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground cursor-pointer">Remember me</Label></div>
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2"><Label htmlFor="signup-name">Full Name</Label><Input id="signup-name" type="text" placeholder="John Doe" value={signupName} onChange={(e) => setSignupName(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><PasswordInput id="signup-password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} showStrength required /></div>
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
