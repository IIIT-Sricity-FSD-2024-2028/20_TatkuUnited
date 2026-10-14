import { useEffect, useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import { useAuthContext } from "@/common/AuthContext";
import {
    getProviderByUser,
    updateProvider,
} from "@/services/providers.service";
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
    const { authDetails } = useAuthContext();
    const [providerId, setProviderId] = useState<string | null>(null);
    const [form, setForm] = useState<SettingsForm>({
    experience: 0,
    workHourStart: 540,
    workHourEnd: 1080,
    workingDays: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const user = authDetails?.user;
    if (!user || user.role !== RolesEnum.PROVIDER) {
        setLoading(false);
        return;
    }

    async function loadSettings() {
        if (!user) return;
        try {
        const provider = await getProviderByUser(user.id);
        setProviderId(provider._id);
        setForm({
            experience: provider.experience,
            workHourStart: provider.workHourStart,
            workHourEnd: provider.workHourEnd,
            workingDays: provider.workingDays,
        });
        } catch (requestError) {
        setError(
            requestError instanceof Error
            ? requestError.message
            : "Unable to load provider settings.",
        );
        } finally {
        setLoading(false);
        }
    }

    void loadSettings();
    }, [authDetails]);

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
    if (!providerId) return;

    try {
        setSaving(true);
        setError(null);
        setMessage(null);
        await updateProvider(providerId, form);
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

    if (authDetails?.user.role !== RolesEnum.PROVIDER) {
    return (
        <Card>
        <CardContent className="pt-6">Provider access required.</CardContent>
        </Card>
    );
    }

    if (loading) {
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
        {error && <p className="text-destructive">{error}</p>}
        <Button disabled={saving} type="submit">
            {saving ? "Saving..." : "Save settings"}
        </Button>
        </FieldGroup>
        </form>
        </CardContent>
    </Card>
        );
}
