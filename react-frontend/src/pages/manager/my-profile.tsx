import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { updateUser } from "@/services/users.service";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import { useAuthContext } from "@/common/AuthContext";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
} from "../../components/ui/item";
import {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function ManagerProfile() {
  const authContext = useAuthContext();
  const storedUser = getStoredUser();
  const userId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  const managerInfo = useSelector((state: RootState) => state.manager.managerInfo);

  const [name, setName] = useState(managerInfo?.name || storedUser?.name || "");
  const [email, setEmail] = useState(managerInfo?.email || storedUser?.email || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateUser(userId, {
        name: name.trim(),
        email: email.trim(),
      });

      const updated = {
        ...(storedUser || {}),
        name: name.trim(),
        email: email.trim(),
      };
      sessionStorage.setItem("user", JSON.stringify(updated));

      setMessage("Manager profile saved successfully!");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err.message || "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || "RM")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manager Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account credentials and personal details.
        </p>
      </div>

      <Item variant="outline">
        <ItemMedia variant="icon">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{name || "Regional Manager"}</ItemTitle>
          <ItemDescription>{email || "manager@tatkuunited.com"}</ItemDescription>
        </ItemContent>
      </Item>

      {message && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal Information</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input
                  id="full-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email-address">Email Address</FieldLabel>
                <Input
                  id="email-address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
