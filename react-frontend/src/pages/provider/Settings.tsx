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
import { formatProviderTime } from "./provider-utils";

function clampMinutes(minutes: number): number {
    if (!Number.isFinite(minutes)) return 0;
    return Math.max(0, Math.min(1439, Math.round(minutes)));
}

function timeToMinutes(value: string): number | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hours = Number(match[1]);
    const mins = Number(match[2]);
    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
    return hours * 60 + mins;
}

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
    const { profile: provider, profileStatus, error: sliceError } = useSelector((s: RootState) => s.provider);

    useEffect(() => {
        if (isProvider && user?.id && !provider && profileStatus === "idle") {
            void dispatch(fetchProviderByUser(user.id));
        }
    }, [dispatch, isProvider, provider, profileStatus, user?.id]);

    useEffect(() => {
        if (provider) {
        setForm({
            experience: provider.experience ?? 0,
            workHourStart: provider.workHourStart ?? 540,
            workHourEnd: provider.workHourEnd ?? 1080,
            workingDays: provider.workingDays ?? [],
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

    if (!Number.isFinite(form.experience) || form.experience < 0 || form.experience > 80) {
        setError("Experience must be between 0 and 80 years.");
        return;
    }
    if (
        !Number.isFinite(form.workHourStart) ||
        !Number.isFinite(form.workHourEnd) ||
        form.workHourStart < 0 ||
        form.workHourStart > 1439 ||
        form.workHourEnd < 1 ||
        form.workHourEnd > 1440 ||
        form.workHourStart >= form.workHourEnd
    ) {
        setError("Work hours must be between 0 and 1440, with end time after start time.");
        return;
    }
    if (form.workingDays.length === 0) {
        setError("Please select at least one working day.");
        return;
    }

    if (form.experience < 0 || form.experience > 80) {
        setError("Experience must be between 0 and 80 years.");
        return;
    }
    if (form.workHourStart < 0 || form.workHourEnd > 1440 || form.workHourStart >= form.workHourEnd) {
        setError("Working hours must be valid and end time must be after start time.");
        return;
    }
    if (form.workingDays.length === 0) {
        setError("Please select at least one working day.");
        return;
    }

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

    const isLoading = profileStatus === "loading" && !provider;
    const isError = (profileStatus === "failed" || Boolean(sliceError)) && !provider;

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
                type="time"
                value={formatProviderTime(clampMinutes(form.workHourStart))}
                onChange={(event) => {
                    const minutes = timeToMinutes(event.target.value);
                    if (minutes === null) return;
                    setForm((current) => ({
                    ...current,
                    workHourStart: minutes,
                    }));
                }}
                />
                <FieldDescription>
                    Start of your daily working hours ({formatProviderTime(clampMinutes(form.workHourStart), true)}).
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="work-end">Work end</FieldLabel>
                <Input
                id="work-end"
                type="time"
                value={formatProviderTime(clampMinutes(form.workHourEnd))}
                onChange={(event) => {
                    const minutes = timeToMinutes(event.target.value);
                    if (minutes === null) return;
                    setForm((current) => ({
                    ...current,
                    workHourEnd: minutes,
                    }));
                }}
                />
                <FieldDescription>
                    End of your daily working hours ({formatProviderTime(clampMinutes(form.workHourEnd), true)}).
                </FieldDescription>
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
