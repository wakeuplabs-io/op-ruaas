import { createLazyFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export const Route = createLazyFileRoute("/app/")({
  component: SubscriptionPlans,
});

const plans = [
  {
    title: "Basic",
    price: 10,
    features: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    buttonText: "Buy now",
    isSelected: true,
  },
  {
    title: "Premium",
    price: 20,
    features: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    buttonText: "Select Plan",
    isSelected: false,
  },
  {
    title: "Pro",
    price: 30,
    features: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    buttonText: "Select Plan",
    isSelected: false,
  },
];
export function SubscriptionPlans() {
  return (
    <div className="p-10">
      <h2 className="text-md font-small mb-8">Choose your plan</h2>
      <div className="flex justify-start gap-6">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={cn(
              "border rounded-lg p-6 w-80 shadow-sm flex flex-col items-start",
              plan.isSelected ? "border-red-500" : "border-gray-200"
            )}
          >
            <h2 className="text-md font-medium">{plan.title}</h2>
            <p className="text-xl font-bold mt-2">
              ${plan.price} <span className="text-sm font-normal">/month</span>
            </p>
            <ul className="mt-4 space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="text-red-500 w-4 h-4" />
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={cn(
                "w-full py-2 border rounded-lg text-sm font-medium",
                plan.isSelected
                  ? "border-red-500 text-red-500"
                  : "border-black text-black"
              )}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
