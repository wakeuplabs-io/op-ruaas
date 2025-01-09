import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useUpdateDeploymentMutation } from "@/lib/queries/deployment";
import { Deployment } from "@/lib/services/deployment";

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

export const UpdateDeploymentNameDialog: React.FC<{
  deployment: Deployment;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ open, setOpen, deployment }) => {
  const { mutateAsync, isPending } = useUpdateDeploymentMutation();
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  });


  function onSubmit(data: z.infer<typeof FormSchema>) {
    mutateAsync({
      ...deployment,
      name: data.name,
    }).then(() => setOpen(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit name</DialogTitle>
          <DialogDescription>
            Update deployment name. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormControl>
                    <Input placeholder="New name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              isPending={isPending}
              size="lg"
              type="submit"
              className="w-full mt-4"
            >
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
