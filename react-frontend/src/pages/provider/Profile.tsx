import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuth from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchProviderUser,
  updateProviderUserThunk,
} from "@/store/provider/provider-slice";
import type { Gender, UpdateUserDto, UserDocument } from "@/models/api.models";

const VALID_GENDERS: readonly Gender[] = ["male", "female", "other"];

function normalizeGender(value?: string): Gender | "" {
  const normalized = value?.trim().toLowerCase();
  return VALID_GENDERS.includes(normalized as Gender) ? (normalized as Gender) : "";
}

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
}

const emptyForm: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  dob: "",
};

function toDateInput(value?: string): string {
  return value ? value.slice(0, 10) : "";
}

function formFromUser(user: Pick<UserDocument, "name" | "email" | "phone" | "gender" | "dob">): ProfileForm {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    gender: normalizeGender(user.gender),
    dob: toDateInput(user.dob),
  };
}

export default function Profile() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userProfile: profile, pending, error: sliceError } = useSelector((s: RootState) => s.provider);

  useEffect(() => {
    if (user?.id) {
      void dispatch(fetchProviderUser(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (profile) setForm(formFromUser(profile));
  }, [profile]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleEditing = () => {
    if (editing && profile) {
      setForm(formFromUser(profile));
      setError(null);
    }
    setEditing((current) => !current);
  };

  const handleSave = async () => {
    if (!profile || !form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    const normalizedGender = normalizeGender(form.gender);
    const changes: UpdateUserDto = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      gender: normalizedGender || undefined,
      dob: form.dob || undefined,
    };

    setError(null);
    setSaving(true);
    try {
      const updatedUser = await dispatch(
        updateProviderUserThunk({ id: profile._id, changes }),
      ).unwrap();
      setForm(formFromUser(updatedUser));
      setEditing(false);
      toast.add({ type: "info", description: "Profile updated successfully." });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save profile changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isLoading = pending > 0 && !profile;
  const isError = Boolean(sliceError) && !profile;

  if (isLoading) {
    return <p className="rounded-lg bg-white p-6 shadow">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <p className="rounded-lg bg-white p-6 text-red-600 shadow">
        {error ?? (isError ? "Unable to load the latest profile details." : "Provider profile is unavailable.")}
      </p>
    );
  }

  const fields: Array<{ key: keyof ProfileForm; label: string; type?: string }> = [
    { key: "name", label: "Full name" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone number", type: "tel" },
    { key: "gender", label: "Gender" },
    { key: "dob", label: "Date of birth", type: "date" },
  ];

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Provider Profile</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              View and update your personal details.
            </p>
          </div>
          <Button
            type="button"
            variant={editing ? "outline" : "default"}
            onClick={toggleEditing}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!editing || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ key, label, type }) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={`profile-${key}`}>{label}</Label>
                {key === "gender" ? (
                  <select
                    id={`profile-${key}`}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form[key]}
                    disabled={!editing || saving}
                    onChange={(event) => updateField(key, event.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <Input
                    id={`profile-${key}`}
                    type={type}
                    value={form[key]}
                    disabled={!editing || saving}
                    onChange={(event) => updateField(key, event.target.value)}
                  />
                )}
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="profile-role">Role</Label>
              <Input id="profile-role" value={profile.role} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-status">Account status</Label>
              <Input id="profile-status" className="capitalize" value={profile.status} disabled />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
