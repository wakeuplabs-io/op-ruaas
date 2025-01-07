import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/confirm")({
  component: RouteComponent,
  validateSearch: z.object({
    user: z.string(),
    step: z.string(),
  }),
});

const FormSchema = z.object({
  code: z.string().length(6),
});

function RouteComponent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, step } = Route.useSearch();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      if (step === "CONFIRM_SIGN_UP") {
        await auth.confirmSignUp(user, data.code);
        navigate({ to: "/auth/signin" });
      } else {
        await auth.confirmSignIn(data.code);
        navigate({ to: "/" });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: e.message,
      });
    }
  }

  function onResendClick() {
    try {
      auth.resendSignUpCode({ username: user });
      toast({
        variant: "default",
        title: "Success!",
        description: "Code resent successfully!",
      });
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
    <div className="w-[350px] mx-auto my-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Confirm account</h1>
            <p className="text-balance text-sm text-muted-foreground">
              Enter the code sent to your email
            </p>
          </div>

          <div>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-right">
              <Button
                type="button"
                variant={"link"}
                size={"sm"}
                className="px-0"
                onClick={onResendClick}
              >
                Resend Code
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={auth.loading}>
            {auth.loading ? "Loading..." : "Confirm"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
