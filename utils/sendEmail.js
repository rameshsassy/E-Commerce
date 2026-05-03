// import fetch from "node-fetch";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const res = await fetch(
      "https://vjyvizcqxxleqhwbefim.supabase.co/functions/v1/send-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ to, subject, html }),
      }
    );

    const data = await res.json();
    console.log("Email response:", data);

  } catch (error) {
    console.log("Email error:", error.message);
  }
};