import { useState } from "react";
import { Profile } from "./EmployeeDirectory";
import "./employee-directory.css";
import "./employee-directory-advanced.css";

export default function EmployeeDetailProfile({ employee, onBack, note, selfView = false }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const emp = employee || {};

  const normalizedEmp = {
    ...emp,
    empId: emp.empId || emp.id || "",
    name: emp.name || "",
    giEmpId: emp.giEmpId || "",
    designation: emp.designation || "",
    department: emp.department || "Production Technology",
    doj: emp.doj || "",
    officeEmail: emp.officeEmail || emp.email || "",
    phone: emp.phone || "",
    dob: emp.dob || "",
    gender: emp.gender || "",
    bloodGroup: emp.bloodGroup || "",
    qualification: emp.qualification || "",
    address: emp.address || emp.permanentAddress || "",
    emergencyContact: emp.emergencyContact || ""
  };

  const changePassword = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    if (newPassword !== form.confirmPassword.value) { setPasswordError("New passwords do not match"); return; }
    try {
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId: normalizedEmp.empId, currentPassword, newPassword }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Password change failed");
      setShowPassword(false); setPasswordError(""); note?.("Password changed successfully");
    } catch (error) { setPasswordError(error.message); }
  };

  return <>
    <Profile
      x={normalizedEmp}
      back={onBack}
      selfView={selfView}
      onChangePassword={() => setShowPassword(true)}
      edit={() => {
        setShowEdit(true);
        note?.("Edit Profile opened");
      }}
      note={note}
    />
    {selfView && showPassword && <div className="emp-modal-overlay" onClick={event => event.target === event.currentTarget && setShowPassword(false)}>
      <form className="emp-modal-box" onSubmit={changePassword}>
        <div className="emp-modal-head"><h3>Change password</h3><button type="button" onClick={() => setShowPassword(false)}>×</button></div>
        <div className="emp-self-password-fields">
          <label>Current password<input name="currentPassword" type="password" required /></label>
          <label>New password<input name="newPassword" type="password" minLength="8" required /></label>
          <label>Confirm new password<input name="confirmPassword" type="password" minLength="8" required /></label>
        </div>
        {passwordError && <strong className="error">{passwordError}</strong>}
        <div className="emp-modal-actions"><button type="button" className="emp-btn-secondary" onClick={() => setShowPassword(false)}>Cancel</button><button className="emp-btn-primary">Save password</button></div>
      </form>
    </div>}
  </>;
}
