import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToast } from "@/lib/hooks/use-toast";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/signin")({
  component: RouteComponent,
});

const FormSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one non-alphanumeric character.",
    }),
});

function RouteComponent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const signinStep = await auth.signIn(data.email, data.password);
      
      if (signinStep === "DONE") {
        navigate({ to: "/" });
      } else {
        navigate({
          to: "/auth/confirm",
          search: { user: data.email, step: signinStep },
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: e.message,
      });
    }
  }

  useEffect(() => {
    if (auth.user) {
      navigate({ to: "/" });
    }
  }, [auth.user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-[350px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Login to your account</h1>
              <p className="text-balance text-sm text-muted-foreground">
                Enter your email below to login to your account
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={auth.loading}
              size="lg"
            >
              {auth.loading ? "Loading..." : "Login"}
            </Button>
          </form>

          <div className="text-center text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/auth/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
