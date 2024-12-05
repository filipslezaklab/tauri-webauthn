import { shallow } from "zustand/shallow";
import { useAppStore } from "./store";
import { useCallback, useState } from "react";
import { server, client } from "@passwordless-id/webauthn";
import {
  AuthenticationInfo,
  RegistrationInfo,
} from "@passwordless-id/webauthn/dist/esm/types";
import "./style.scss";

const origin = window.location.origin;

const domain = window.location.hostname;

function App() {
  const [registration, setRegistration] = useState<
    RegistrationInfo | undefined
  >(undefined);
  const [authResult, setAuthResult] = useState<AuthenticationInfo | undefined>(
    undefined,
  );
  const [available, setAvailable] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);
  const credential = useAppStore((s) => s.credential, shallow);

  const setStore = useAppStore((s) => s.setStore, shallow);

  const handleClick = useCallback(async () => {
    if (!available) return;
    // no credentials so register self
    const requestChallenge = server.randomChallenge();
    setLoading(true);
    try {
      if (requestChallenge !== undefined && !credential) {
        const registration = await client.register({
          user: "Test User",
          challenge: requestChallenge,
          domain,
        });
        console.log(registration);
        const parsed = await server.verifyRegistration(registration, {
          challenge: requestChallenge,
          origin: origin,
        });
        console.log(parsed);
        setRegistration(parsed);
        setStore({
          credential: parsed.credential,
        });
      }
      if (requestChallenge !== undefined && credential) {
        const verification = await client.authenticate({
          domain,
          challenge: requestChallenge,
          allowCredentials: [credential.id],
        });
        console.log(verification);
        const result = await server.verifyAuthentication(
          verification,
          credential,
          {
            challenge: requestChallenge,
            origin: origin,
            userVerified: true,
          },
        );
        console.log(result);
        setAuthResult(result);
      }
    } catch (e) {
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [credential, available]);

  return (
    <main id="app">
      <p>State of app:</p>
      <ul>
        <li>Current window Hostname: {window.location.hostname}</li>
        <li>Current window Origin: {window.location.origin}</li>
        <li>Is secure context?: {JSON.stringify(window.isSecureContext)}</li>
        <li>Platform supports Webauthn: {JSON.stringify(available)}</li>
        <li>Registered: {JSON.stringify(credential !== undefined)}</li>
        <li>
          Authentication passed:{" "}
          {authResult ? JSON.stringify(authResult?.userVerified) : "No"}
        </li>
        <li>
          Registered platform authenticator name:{" "}
          {registration?.authenticator.name ?? "not present"}
        </li>
      </ul>
      <button
        disabled={available}
        onClick={() => {
          setAvailable(client.isAvailable);
        }}
      >
        Check platform availability
      </button>
      <button disabled={loading || !available} onClick={handleClick}>
        Webauthn{loading && "(loading)"}
      </button>
      <p>Debug:</p>
      <p>
        {JSON.stringify({
          credential,
          authResult,
        })}
      </p>
      <p>Error: {JSON.stringify(error)}</p>
      <button
        onClick={() => {
          setLoading(false);
          setAvailable(undefined);
          setStore({ credential: undefined });
          setAuthResult(undefined);
        }}
      >
        Restart the whole thing
      </button>
    </main>
  );
}

export default App;
