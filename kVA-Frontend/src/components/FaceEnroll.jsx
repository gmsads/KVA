import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function FaceEnroll({ studentId, studentName, onFaceRegistered }) {
  const faceioRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.faceIO && !faceioRef.current) {
      faceioRef.current = new window.faceIO("YOUR_FACEIO_PUBLIC_ID"); // 🔑 Replace with your FaceIO Public ID
    }
  }, []);

  const handleEnrollFace = async () => {
    if (!studentId) {
      toast.error("❌ Student ID not available. Please save student first.");
      return;
    }

    try {
      setLoading(true);
      const userInfo = await faceioRef.current.enroll({
        locale: "auto",
        payload: { studentId: studentId, name: studentName },
      });

      // 👉 Save faceId in your backend
      await fetch(`http://localhost:5000/api/students/${studentId}/face`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceId: userInfo.facialId }),
      });

      toast.success("✅ Face registered successfully!");
      onFaceRegistered(true);
    } catch (err) {
      console.error("❌ Face enrollment failed:", err);
      toast.error("Error enrolling face!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <button className="btn btn-primary" onClick={handleEnrollFace} disabled={loading}>
        {loading ? "Registering..." : "Register Face Now"}
      </button>
    </div>
  );
}
