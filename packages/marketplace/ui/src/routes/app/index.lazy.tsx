import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { PLANS } from "@/shared/constants/marketplace";
import { Plan } from "@/types";
import { useCreateOrder } from "@/hooks/use-create-order";
import { UnsubscribeModal } from "@/components/unsubscribe-modal";



export const Route = createLazyFileRoute("/app/")({
  component: SubscriptionPlans,
});

export function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [loading, setLoading] = useState(false);
  const { approveAndCreateOrder, userAddress } = useCreateOrder();

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleOrder = async () => {
    if (!userAddress) {
      alert("Please connect your wallet.");
      return;
    }

    try {
      setLoading(true);
      await approveAndCreateOrder(selectedPlan.id, selectedPlan.deploymentFee);
      alert("Order created successfully!");
    } catch (error) {
      alert("Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <h2 className="text-md font-medium mb-8">Choose your plan</h2>

      <UnsubscribeModal>
        Unsubscribe
      </UnsubscribeModal>
      <div className="flex justify-start gap-6">
        {PLANS.map((plan, index) => (
          <div
            key={index}
            className={cn(
              "border rounded-lg p-6 w-80 shadow-sm flex flex-col items-start transition-colors",
              plan.title === selectedPlan.title ? "border-red-500" : "border-gray-200"
            )}
            onClick={() => handlePlanSelect(plan)}

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
              onClick={handleOrder}
              className={cn(
                "w-full py-2 border rounded-lg text-sm font-medium transition-all",
                plan.title === selectedPlan.title ? "border-red-500 text-red-500" : "border-black text-black",
              )}
              disabled={loading}
            >
              {plan.title === selectedPlan.title ? "Buy now" : "Select plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
