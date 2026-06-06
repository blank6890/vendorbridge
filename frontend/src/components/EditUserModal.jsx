import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { editUser } from "@/api";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ROLES = ["Admin", "Officer", "Manager", "Vendor"];
const STATUSES = ["Active", "Pending", "Disabled"];

export default function EditUserModal({ open, onOpenChange, user, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Officer", status: "Active" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "Officer",
      status: user.status ?? "Active",
    });
    setError("");
  }, [user, open]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?._id) return;

    setSaving(true);
    setError("");

    try {
      const updated = await editUser(user._id, form);
      onSaved?.(updated);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Edit User" description="Update account details and access level.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-name">Name</Label>
            <Input
              id="edit-user-name"
              value={form.name}
              onChange={handleChange("name")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-user-email">Email</Label>
            <Input
              id="edit-user-email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-user-role">Role</Label>
              <Select id="edit-user-role" value={form.role} onChange={handleChange("role")}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-status">Status</Label>
              <Select id="edit-user-status" value={form.status} onChange={handleChange("status")}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
