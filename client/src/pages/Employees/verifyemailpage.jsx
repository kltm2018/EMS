import React, { useState } from "react";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Gửi mã xác thực lên backend
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("http://localhost:5000/api/hr/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationcode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("✅ Xác thực email thành công!");
      } else {
        setStatus(`❌ ${data.message || "Đã xảy ra lỗi"}`);
      }
    } catch (err) {
      setStatus("❌ Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã xác thực
  const handleResend = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("http://localhost:5000/api/hr/resend-verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("✅ Đã gửi lại mã xác thực, vui lòng kiểm tra email.");
      } else {
        setStatus(`❌ ${data.message || "Không gửi lại được mã xác thực."}`);
      }
    } catch (err) {
      setStatus("❌ Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: "40px auto",
      border: "1px solid #ddd",
      borderRadius: 10,
      padding: 32,
      background: "#f9f9f9"
    }}>
      <h2>Xác thực Email</h2>
      <form onSubmit={handleVerify}>
        <label>
          Email đăng ký:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 16 }}
            placeholder="Nhập email của bạn"
          />
        </label>
        <label>
          Nhập mã xác thực:
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 16, letterSpacing: 4 }}
            placeholder="Nhập mã xác thực"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 4,
            background: "#1976d2",
            color: "#fff",
            border: "none",
            marginBottom: 12,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Đang xác thực..." : "Xác thực"}
        </button>
      </form>
      <button
        onClick={handleResend}
        disabled={loading || !email}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 4,
          background: "#2196f3",
          color: "#fff",
          border: "none",
          marginBottom: 8,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        Gửi lại mã xác thực
      </button>
      <div style={{ minHeight: 32, color: status.startsWith("✅") ? "green" : "red" }}>
        {status}
      </div>
    </div>
  );
}