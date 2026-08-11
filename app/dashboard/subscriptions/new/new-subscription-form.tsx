"use client";

import { useFormState } from "react-dom";
import {
  createSubscription,
  type ActionState,
} from "@/app/dashboard/subscriptions/actions";
import { SubscriptionFormFields } from "@/app/dashboard/subscriptions/subscription-form-fields";

export function NewSubscriptionForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(
    createSubscription,
    undefined
  );

  return (
    <form action={formAction}>
      <SubscriptionFormFields
        submitLabel="Add subscription"
        error={state?.error}
      />
    </form>
  );
}
