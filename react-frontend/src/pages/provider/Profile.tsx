import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/common/AuthContext";
import { getUserById, updateUser } from "@/services/users.service";
import type { UpdateUserDto, UserDocument } from "@/models/api.models";

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
    gender: user.gender ?? "",
    dob: toDateInput(user.dob),
  };
}

export default function Profile() {
  const { authDetails, setAuthDetails } = useAuthContext();
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = authDetails?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    const userId = user.id;

    const sessionUser = {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status as UserDocument["status"],
      createdAt: "",
      updatedAt: "",
    } satisfies UserDocument;

    setProfile(sessionUser);
    setForm(formFromUser(sessionUser));

    async function loadProfile() {
      try {
        const latestUser = await getUserById(userId);
        setProfile(latestUser);
        setForm(formFromUser(latestUser));
      } catch {
        setError("Unable to load the latest profile details.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [authDetails]);

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
    if (!profile || !authDetails || !form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    const changes: UpdateUserDto = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      gender: form.gender.trim() || undefined,
      dob: form.dob || undefined,
    };

    setSaving(true);
    setError(null);
    try {
      const updatedUser = await updateUser(profile._id, changes);
      setProfile(updatedUser);
      setForm(formFromUser(updatedUser));
      setEditing(false);
      setAuthDetails((current) =>
        current
          ? {
              ...current,
              user: {
                ...current.user,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
              },
            }
          : current,
      );
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          ...authDetails.user,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
        }),
      );
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

  if (loading) {
    return <p className="rounded-lg bg-white p-6 shadow">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <p className="rounded-lg bg-white p-6 text-red-600 shadow">
        {error ?? "Provider profile is unavailable."}
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
                <Input
                  id={`profile-${key}`}
                  type={type}
                  value={form[key]}
                  disabled={!editing || saving}
                  onChange={(event) => updateField(key, event.target.value)}
                />
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
