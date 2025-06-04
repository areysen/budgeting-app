"use client";

import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useSession } from "@supabase/auth-helpers-react";

export default function ConnectBank() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const session = useSession();

  // Fetch the link token on mount
  useEffect(() => {
    console.log("🧪 useEffect hit. Session:", session);
    if (!session) {
      console.warn("⚠️ Session is still null, waiting...");
      return;
    }

    const fetchLinkToken = async () => {
      console.log("🔁 useEffect triggered. Session:", session);
      if (!session.access_token) {
        console.warn(
          "⚠️ Session exists but missing access_token, skipping fetch."
        );
        return;
      }

      try {
        const url = "/api/create-link-token";

        console.log("🌐 Fetching link token from:", url);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
          mode: "cors",
        });

        let data;
        try {
          data = await res.json();
        } catch (parseErr) {
          console.error("❌ Failed to parse JSON from response:", parseErr);
          throw parseErr;
        }
        console.log("🎯 Received link token response:", data);

        if (res.ok && data.link_token) {
          console.log(
            "🎉 Successful response from create-link-token function:",
            data
          );
          setLinkToken(data.link_token);
          console.log("🪪 Fetched link token value is:", data.link_token);
          console.log("✅ Link token set in state");
        } else {
          console.error("❌ Failed to get valid link_token", data);
        }
      } catch (err) {
        console.error("🔥 Error fetching link token:", err);
      }
    };

    fetchLinkToken();
    console.log("📡 fetchLinkToken() fired inside useEffect for debugging");
    console.log("🚀 fetchLinkToken() has been invoked");
  }, [session]);

  interface PlaidConfig {
    token: string;
    onSuccess: (public_token: string, metadata: PlaidMetadata) => Promise<void>;
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

  const config: PlaidConfig = {
    token: linkToken ?? "",
    onSuccess: async (public_token: string, metadata: PlaidMetadata) => {
      const user_id = session?.user?.id;

      // Debug logs before fetch
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
  };

  const plaid = usePlaidLink(config);

  console.log("🔍 Debug:", { linkToken, plaidReady: plaid.ready });
  return (
    <>
      <pre className="text-xs bg-gray-100 text-black p-2 mb-4 rounded">
        {linkToken
          ? `✅ Link Token Ready:\n${linkToken}`
          : "⏳ Waiting for Link Token..."}
      </pre>
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
        onClick={() => plaid.open()}
        disabled={!linkToken || !plaid.ready}
      >
        Connect Bank Account
      </button>
    </>
  );
}
