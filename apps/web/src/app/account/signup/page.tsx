/**
 * ⚠ ANYTHING PLATFORM — DO NOT REWRITE THIS FILE ⚠
 *
 * Shipped v2 auth scaffolding. The <form onSubmit>, e.preventDefault(), and
 * window.location.href redirect are load-bearing for the mobile WebView auth
 * flow (AuthWebView intercepts the navigation to capture the session). A
 * prior AI rewrite replaced <form onSubmit> with <button onClick> and broke
 * signup platform-wide — "credentials cleared" / "button does nothing" for
 * every user until a human reverted it. DO NOT repeat that mistake.
 *
 *   Safe:   restyle, rewrite copy, add form fields (pass `name` explicitly).
 *   Unsafe: replacing <form>, removing preventDefault, bypassing
 *           authClient.signUp.email, changing the callbackUrl redirect.
 */
"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { SocialSignInButtons } from "@/components/SocialSignInButtons";
import { authClient } from "@/lib/auth-client";

function SignUpForm() {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		// The server backfills `name` from the email local-part when it's missing,
		// so email + password is enough.
		const { error: signUpError } = await authClient.signUp.email({
			email,
			password,
			name: "",
		});

		if (signUpError) {
			setError(signUpError.message ?? "Sign up failed");
			setLoading(false);
			return;
		}

		if (typeof window !== "undefined") {
			window.location.href = callbackUrl;
		} else {
			console.warn(
				"signup: window is undefined; cannot redirect to callbackUrl",
			);
		}
	};

	return (
		<main className="flex min-h-dvh w-full items-start justify-center bg-gray-50 px-[16px] pb-[16px] pt-[40px] sm:items-center sm:pt-[16px]">
			<form
				onSubmit={(e) => {
					void onSubmit(e);
				}}
				className="flex w-full max-w-[400px] flex-col gap-[16px] rounded-[12px] bg-white p-[24px] shadow"
			>
				<h1 className="text-[24px] font-semibold">Create account</h1>

				<label className="flex flex-col gap-[4px] text-[14px]">
					Email
					<input
						type="email"
						required
						autoComplete="email"
						inputMode="email"
						autoCapitalize="off"
						spellCheck={false}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="rounded-[8px] border border-gray-300 p-[10px] text-[16px] outline-none focus:border-blue-500"
					/>
				</label>

				<label className="flex flex-col gap-[4px] text-[14px]">
					Password
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							required
							minLength={8}
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded-[8px] border border-gray-300 p-[10px] pr-[44px] text-[16px] outline-none focus:border-blue-500"
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							aria-label={showPassword ? "Hide password" : "Show password"}
							className="absolute right-[10px] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:text-gray-800"
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					</div>
				</label>

				{error && (
					<div className="rounded-[8px] bg-red-50 p-[10px] text-[14px] text-red-600">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="rounded-[8px] bg-od-ink p-[12px] text-[16px] font-medium text-white disabled:opacity-50"
				>
					{loading ? "Creating account…" : "Sign Up"}
				</button>

				<SocialSignInButtons callbackUrl={callbackUrl} />

				<a
					href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
					className="text-center text-[14px] text-od-leaf hover:underline"
				>
					Already have an account? Sign in
				</a>
			</form>
		</main>
	);
}

export default function SignUpPage() {
	return (
		<Suspense>
			<SignUpForm />
		</Suspense>
	);
}
