import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={72}
      richColors
      closeButton
      toastOptions={{
        style: { opacity: 0.94 },
        classNames: {
          toast:
            "group toast group-[.toaster]:backdrop-blur-xl group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-green-500/15 group-[.toaster]:!text-green-500 group-[.toaster]:!border-green-500/40",
          warning: "group-[.toaster]:!bg-yellow-500/15 group-[.toaster]:!text-yellow-500 group-[.toaster]:!border-yellow-500/40",
          error: "group-[.toaster]:!bg-red-500/15 group-[.toaster]:!text-red-500 group-[.toaster]:!border-red-500/40",
          info: "group-[.toaster]:!bg-yellow-500/10 group-[.toaster]:!text-yellow-400 group-[.toaster]:!border-yellow-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
