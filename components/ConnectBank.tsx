"use client";

import { createBrowserClient } from "@supabase/ssr";

const createClientComponentClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function ConnectBank() {
  const supabase = createClientComponentClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        setAccessToken(data.session.access_token);
      }
    };
    getSession();
  }, []);

  // Fetch the link token once when a valid session is available
  useEffect(() => {
    if (!accessToken || fetchedRef.current || linkToken) {
      return;
    }

    fetchedRef.current = true;

    const fetchLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();

        if (response.ok && data?.link_token) {
          setLinkToken(data.link_token);
        } else {
          console.error("❌ Failed to get valid link_token", data);
        }
      } catch (err) {
        console.error("🔥 Error fetching link token:", err);
      }
    };

    fetchLinkToken();
  }, [accessToken, linkToken]);

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

  function PlaidLinkButton({ token }: { token: string }) {
    const config: PlaidConfig = useMemo(
      () => ({
        token,
        onSuccess: async (public_token: string, metadata: PlaidMetadata) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const user_id = user?.id;

          console.log("🌍 Environment:", process.env.NODE_ENV);
          console.log("🔗 Calling store-public-token with payload:", {
            public_token,
            institution: metadata.institution?.name,
            user_id,
          });

          const response = await fetch("/api/plaid/store-public-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
            body: JSON.stringify({
              public_token,
              institution: metadata.institution?.name,
              user_id,
            }),
          });

          if (response.ok) {
            const { item_id } = await response.json();
            console.log("🔐 Public token stored successfully");

            let plaidItemId = item_id;
            if (item_id) {
              const exchangeRes = await fetch(
                "/api/plaid/exchange-public-token",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    public_token,
                    item_id,
                  }),
                }
              );

              if (exchangeRes.ok) {
                const exchangeData = await exchangeRes.json();
                plaidItemId = exchangeData.plaid_item_id || item_id;
                console.log(
                  "🔄 Successfully exchanged public token for access token"
                );
              } else {
                const exchangeErr = await exchangeRes.json();
                console.error(
                  "❌ Failed to exchange public token",
                  exchangeErr
                );
              }
            }

            await fetch("/api/plaid/accounts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
              },
              body: JSON.stringify({ plaidItemId }),
            });

            await fetch("/api/plaid/transactions/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: accessToken ? `Bearer ${accessToken}` : "",
              },
              body: JSON.stringify({ plaidItemId }),
            });
          } else {
            const errorData = await response.json();
            console.error("❌ Failed to store public token", errorData);
          }
        },
      }),
      [token]
    );

    const plaid = usePlaidLink(config);

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
