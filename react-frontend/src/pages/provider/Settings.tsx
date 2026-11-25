import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import {
    fetchProviderByUser,
    updateProviderThunk,
} from "@/store/provider/provider-slice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface SettingsForm {
    experience: number;
    workHourStart: number;
    workHourEnd: number;
    workingDays: number[];
}

const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

export default function Settings() {
    const { user } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const isProvider = user?.role === RolesEnum.PROVIDER;
    const [form, setForm] = useState<SettingsForm>({
    experience: 0,
    workHourStart: 540,
    workHourEnd: 1080,
    workingDays: [],
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { profile: provider, pending, error: sliceError } = useSelector((s: RootState) => s.provider);

    useEffect(() => {
        if (isProvider && user?.id) {
            void dispatch(fetchProviderByUser(user.id));
        }
    }, [dispatch, isProvider, user?.id]);

    useEffect(() => {
        if (provider) {
        setForm({
            experience: provider.experience,
            workHourStart: provider.workHourStart,
            workHourEnd: provider.workHourEnd,
            workingDays: provider.workingDays,
        });
        }
    }, [provider]);

    function toggleDay(day: number) {
    setForm((current) => ({
        ...current,
        workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((value) => value !== day)
        : [...current.workingDays, day].sort(),
    }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const providerId = provider?._id;
    if (!providerId) return;

    try {
        setError(null);
        setMessage(null);
        setSaving(true);
        await dispatch(updateProviderThunk({ id: providerId, changes: form })).unwrap();
        setMessage("Provider settings saved.");
    } catch (requestError) {
        setError(
            requestError instanceof Error
            ? requestError.message
            : "Unable to save provider settings.",
        );
    } finally {
        setSaving(false);
    }
    }

    if (!isProvider) {
    return (
        <Card>
        <CardContent className="pt-6">Provider access required.</CardContent>
        </Card>
    );
    }

    const isLoading = pending > 0 && !provider;
    const isError = Boolean(sliceError) && !provider;

    if (isLoading) {
    return (
        <Card>
        <CardContent className="pt-6">Loading settings...</CardContent>
        </Card>
    );
    }

    return (
    <Card className="max-w-2xl">
        <CardHeader>
        <CardTitle className="text-2xl">Provider Settings</CardTitle>
        <CardDescription>
            Update your availability and experience details.
        </CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit}>
        <FieldGroup>
            <Field>
            <FieldLabel htmlFor="experience">Experience (years)</FieldLabel>
            <Input
                id="experience"
                min="0"
                type="number"
                value={form.experience}
                onChange={(event) =>
                setForm((current) => ({
                    ...current,
                    experience: Number(event.target.value),
                }))
                }
            />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
            <Field>
                <FieldLabel htmlFor="work-start">
                Work start
                </FieldLabel>
                <Input
                id="work-start"
                min="0"
                max="1439"
                type="number"
                value={form.workHourStart}
                onChange={(event) =>
                    setForm((current) => ({
                    ...current,
                    workHourStart: Number(event.target.value),
                    }))
                }
                />
                <FieldDescription>Minutes from midnight.</FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="work-end">Work end</FieldLabel>
                <Input
                id="work-end"
                min="0"
                max="1439"
                type="number"
                value={form.workHourEnd}
                onChange={(event) =>
                    setForm((current) => ({
                    ...current,
                    workHourEnd: Number(event.target.value),
                    }))
                }
                />
                <FieldDescription>Minutes from midnight.</FieldDescription>
            </Field>
            </div>

            <Separator />

            <FieldSet>
            <FieldLegend variant="label">Working days</FieldLegend>
            <div className="grid gap-2 sm:grid-cols-2">
            {days.map((label, day) => (
                <FieldLabel className="font-normal" key={label}>
                <input
                    checked={form.workingDays.includes(day)}
                    type="checkbox"
                    onChange={() => toggleDay(day)}
                />
                {label}
                </FieldLabel>
            ))}
            </div>
            </FieldSet>

        {message && <p className="text-green-600">{message}</p>}
        {(error || isError) && <p className="text-destructive">{error ?? "Unable to load provider settings."}</p>}
        <Button disabled={saving} type="submit">
            {saving ? "Saving..." : "Save settings"}
        </Button>
        </FieldGroup>
        </form>
        </CardContent>
    </Card>
        );
}
