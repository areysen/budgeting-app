"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

export default function ConnectBank() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const session = useSession();
  const supabase = useSupabaseClient();
  const fetchedRef = useRef(false);

  // Fetch the link token once when a valid session is available
  useEffect(() => {
    if (!session?.access_token || fetchedRef.current || linkToken) {
      return;
    }

    fetchedRef.current = true;

    const fetchLinkToken = async () => {

      try {
        const { data, error } = await supabase.functions.invoke(
          "create-link-token",
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        console.log("🎯 Received link token response:", data);

        if (!error && data?.link_token) {
          console.log(
            "🎉 Successful response from create-link-token function:",
            data
          );
          setLinkToken(data.link_token);
          console.log("🪪 Fetched link token value is:", data.link_token);
          console.log("✅ Link token set in state");
        } else {
          console.error("❌ Failed to get valid link_token", error);
        }
      } catch (err) {
        console.error("🔥 Error fetching link token:", err);
      }
    };

    fetchLinkToken();
  }, [session, linkToken]);

  interface PlaidConfig {
    token: string;
    onSuccess: (
      public_token: string,
      metadata: PlaidMetadata
    ) => Promise<void>;
  }

  interface PlaidMetadata {
    institution?: {
      name?: string;
      institution_id?: string | null;
    } | null;
    accounts?: Array<{
      id: string;
      name: string;
      mask?: string;
      type: string;
      subtype?: string;
    }>;
  }

  function PlaidLinkButton({ token }: { token: string }) {
    const config: PlaidConfig = useMemo(
      () => ({
        token,
        onSuccess: async (
          public_token: string,
          metadata: PlaidMetadata
        ) => {
          const user_id = session?.user?.id;

          console.log("🌍 Environment:", process.env.NODE_ENV);
          console.log("🔗 Calling store-public-token with payload:", {
            public_token,
            institution: metadata.institution?.name,
            user_id,
          });

          const response = await fetch("/api/store-public-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: session ? `Bearer ${session.access_token}` : "",
            },
            body: JSON.stringify({
              public_token,
              institution: metadata.institution?.name,
              user_id,
            }),
          });

          if (response.ok) {
            console.log("🔐 Public token stored successfully");
          } else {
            const errorData = await response.json();
            console.error("❌ Failed to store public token", errorData);
          }
        },
      }),
      [token, session]
    );

    const plaid = usePlaidLink(config);

    console.log("🔍 Debug:", { linkToken: token, plaidReady: plaid.ready });

    return (
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
        onClick={() => plaid.open()}
        disabled={!plaid.ready}
      >
        Connect Bank Account
      </button>
    );
  }

  return (
    <>
      <pre className="text-xs bg-gray-100 text-black p-2 mb-4 rounded">
        {linkToken
          ? `✅ Link Token Ready:\n${linkToken}`
          : "⏳ Waiting for Link Token..."}
      </pre>
      {linkToken && <PlaidLinkButton token={linkToken} />}
    </>
  );
}
