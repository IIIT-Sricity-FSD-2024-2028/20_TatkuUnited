import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchSuperuserProfile,
  updateSuperuserProfile,
} from "@/store/superuser/superuser-slice";
import { toast } from "@/components/ui/toast";
import type { UpdateUserDto } from "@/models/api.models";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
} from "@/components/ui/item";
import {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (form: ProfileForm): Partial<ProfileForm> => ({
  name: form.name.trim().length < 2 ? "Enter your full name" : undefined,
  email: EMAIL_PATTERN.test(form.email.trim())
    ? undefined
    : "Enter a valid email address",
  phone: /^\d{10}$/.test(form.phone.trim())
    ? undefined
    : "Phone number must be 10 digits",
});

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export default function SuperUser_Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const [saving, setSaving] = useState(false);
  const { userInfo, pending, error } = useSelector(
    (state: RootState) => state.superuser,
  );
  const loading = pending > 0 && !userInfo;

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof ProfileForm, boolean>>
  >({});

  useEffect(() => {
    if (!userInfo) {
      void dispatch(fetchSuperuserProfile());
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (userInfo) {
      setForm({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone ?? "",
      });
      setTouched({});
    }
  }, [userInfo]);

  const errors = validate(form);
  const isValid = !errors.name && !errors.email && !errors.phone;
  const isDirty =
    !!userInfo &&
    (form.name.trim() !== userInfo.name ||
      form.email.trim() !== userInfo.email ||
      form.phone.trim() !== (userInfo.phone ?? ""));

  const bind = (field: keyof ProfileForm) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value })),
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
    "aria-invalid": touched[field] && !!errors[field],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo || !isDirty || !isValid) return;

    const changes: UpdateUserDto = {};
    if (form.name.trim() !== userInfo.name) changes.name = form.name.trim();
    if (form.email.trim() !== userInfo.email) changes.email = form.email.trim();
    if (form.phone.trim() !== (userInfo.phone ?? ""))
      changes.phone = form.phone.trim();

    setSaving(true);
    try {
      await dispatch(
        updateSuperuserProfile({ userId: userInfo._id, changes }),
      ).unwrap();
      toast.add({ type: "info", description: "Profile updated" });
    } catch (err) {
      const duplicate = (err as Error).message === "EMAIL_TAKEN";
      toast.add({
        type: "error",
        description: duplicate
          ? "That email is already used by another account"
          : "Could not save your profile",
        priority: "high",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super User Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account credentials and personal details.
        </p>
      </div>

      {error && !userInfo && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      <Item variant="outline">
        <ItemMedia variant="icon">
          <Avatar>
            <AvatarFallback>{getInitials(userInfo?.name ?? "")}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          {loading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <>
              <ItemTitle>{userInfo?.name ?? "Super User"}</ItemTitle>
              <ItemDescription>{userInfo?.email ?? ""}</ItemDescription>
            </>
          )}
        </ItemContent>
      </Item>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal Information</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input id="full-name" {...bind("name")} required />
                {touched.name && errors.name && (
                  <FieldError>{errors.name}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email-address">Email Address</FieldLabel>
                <Input
                  id="email-address"
                  type="email"
                  {...bind("email")}
                  required
                />
                {touched.email && errors.email && (
                  <FieldError>{errors.email}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  id="phone"
                  inputMode="numeric"
                  {...bind("phone")}
                  required
                />
                {touched.phone && errors.phone && (
                  <FieldError>{errors.phone}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>


          <Field orientation="horizontal">
            <Button type="submit" disabled={!isDirty || !isValid || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
