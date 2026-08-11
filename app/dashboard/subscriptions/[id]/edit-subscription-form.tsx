"use client";

import { useFormState } from "react-dom";
import {
  updateSubscription,
  type ActionState,
} from "@/app/dashboard/subscriptions/actions";
import { SubscriptionFormFields } from "@/app/dashboard/subscriptions/subscription-form-fields";
import type { SubscriptionFormDefaults } from "@/app/dashboard/subscriptions/subscription-form-fields";

type Props = {
  subscriptionId: string;
  defaults: SubscriptionFormDefaults;
};

export function EditSubscriptionForm({ subscriptionId, defaults }: Props) {
  const boundUpdate = updateSubscription.bind(null, subscriptionId);
  const [state, formAction] = useFormState<ActionState, FormData>(
    boundUpdate,
    undefined
  );

  return (
    <form action={formAction}>
      <SubscriptionFormFields
        defaults={defaults}
        submitLabel="Save changes"
        error={state?.error}
      />
    </form>
  );
}
