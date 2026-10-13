import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { ManagerActions } from "../../store/manager/manager-slice";
import { toast } from "../../components/ui/toast";
import { updateUser } from "@/services/users.service";
import type { UpdateUserDto } from "@/models/api.models";
import { Skeleton } from "../../components/ui/skeleton";
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
  FieldError,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// returns an error message per invalid field, and nothing for valid ones
const validate = (form: ProfileForm): Partial<ProfileForm> => ({
  name: form.name.trim().length < 2 ? "Enter your full name" : undefined,
  email: EMAIL_PATTERN.test(form.email.trim())
    ? undefined
    : "Enter a valid email address",
  phone: /^\d{10}$/.test(form.phone.trim())
    ? undefined
    : "Phone number must be 10 digits",
});

// "Shri Manager" -> "SM"
const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export default function ManagerProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const [saving, setSaving] = useState(false);
  const { userInfo, managerInfo, regions, selectedRegionId, pending } =
    useSelector((state: RootState) => state.manager);
  const loading = pending > 0 && !userInfo;
  const region = regions.find((r) => r._id === selectedRegionId);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
  });
  // errors are only shown once the person has touched that field
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});

  // fill the form when the user loads, or whenever the stored user changes
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

    // send only the fields that changed, never the whole user object
    const changes: UpdateUserDto = {};
    if (form.name.trim() !== userInfo.name) changes.name = form.name.trim();
    if (form.email.trim() !== userInfo.email) changes.email = form.email.trim();
    if (form.phone.trim() !== (userInfo.phone ?? ""))
      changes.phone = form.phone.trim();

    setSaving(true);
    try {
      const updated = await updateUser(userInfo._id, changes);
      dispatch(ManagerActions.userUpdated({ ...userInfo, ...updated }));
      toast.add({ type: "info", description: "Profile updated" });
    } catch (error) {
      const duplicate =
        axios.isAxiosError(error) && error.response?.status === 409;
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
    <div>
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
              <ItemTitle>{userInfo?.name ?? "Manager"}</ItemTitle>
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
                <Input id="email-address" type="email" {...bind("email")} required />
                {touched.email && errors.email && (
                  <FieldError>{errors.email}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input id="phone" inputMode="numeric" {...bind("phone")} required />
                {touched.phone && errors.phone && (
                  <FieldError>{errors.phone}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Work Details</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel>Region</FieldLabel>
                <Input value={region?.name ?? "No region assigned"} readOnly />
              </Field>
              <Field>
                <FieldLabel>Experience</FieldLabel>
                <Input
                  value={
                    managerInfo ? `${managerInfo.experience} years` : ""
                  }
                  readOnly
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Input
                  className="capitalize"
                  value={managerInfo?.status ?? ""}
                  readOnly
                />
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

