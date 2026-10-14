import { useEffect, useMemo, useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import { useAuthContext } from "@/common/AuthContext";
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { buildEndpoint, ENDPOINT_ENUM } from "@/common/endpoints";
import {
    getProviderByUser,
    getProviderSchedule,
} from "@/services/providers.service";
import type { BookingDocument, ProviderDocument, ServiceDocument, UserDocument } from "@/models/api.models";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface UnavailabilityRecord {
    _id: string;
    provider: string | ProviderDocument;
    date: string;
    startTime: number;
    endTime: number;
    reason: string | null;
}

interface CalendarDateData {
    jobs: BookingDocument[];
    unavailability: UnavailabilityRecord[];
}

type CalendarData = Record<string, CalendarDateData>;
type SelectedItem =
    | { type: "job"; item: BookingDocument }
    | { type: "unavailability"; item: UnavailabilityRecord }
    | null;

const EMPTY_DATE_DATA: CalendarDateData = { jobs: [], unavailability: [] };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDateFromKey(key: string): Date {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function getMonthDays(month: Date): Date[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    const end = new Date(lastDay);
    end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    const days: Date[] = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        days.push(new Date(cursor));
    }
    return days;
}

function getServiceName(booking: BookingDocument): string {
    return typeof booking.service === "string"
        ? "Service"
        : (booking.service as ServiceDocument).name;
}

function getCustomerName(booking: BookingDocument): string {
    return typeof booking.customer === "string"
        ? "Customer"
        : (booking.customer as UserDocument).name;
}

function getApiDate(value: string): string {
    return value.slice(0, 10);
}

function buildCalendarData(
    jobs: BookingDocument[],
    unavailability: UnavailabilityRecord[],
): CalendarData {
    const data: CalendarData = {};

    for (const job of jobs) {
        const key = getApiDate(job.scheduledDate);
        data[key] ??= { jobs: [], unavailability: [] };
        data[key].jobs.push(job);
    }

    for (const slot of unavailability) {
        const key = getApiDate(slot.date);
        data[key] ??= { jobs: [], unavailability: [] };
        data[key].unavailability.push(slot);
    }

    return data;
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export default function JobCalender() {
    const { authDetails } = useAuthContext();
    const [month, setMonth] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
    const [calendarData, setCalendarData] = useState<CalendarData>({});
    const [provider, setProvider] = useState<ProviderDocument | null>(null);
    const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        date: toDateKey(new Date()),
        startTime: 480,
        endTime: 600,
        reason: "",
    });

    const days = useMemo(() => getMonthDays(month), [month]);
    const selectedDateData = useMemo(
        () => calendarData[selectedDate] ?? EMPTY_DATE_DATA,
        [calendarData, selectedDate],
    );

    async function loadCalendar(providerId: string) {
        const [jobs, unavailability] = await Promise.all([
            getProviderSchedule(providerId),
            apiService<UnavailabilityRecord[]>(
                HTTP_METHODS_ENUM.get,
                buildEndpoint(ENDPOINT_ENUM.UNAVAILABILITY_BY_PROVIDER, { providerId }),
            ),
        ]);
        setCalendarData(buildCalendarData(jobs, unavailability));
    }

    useEffect(() => {
        const user = authDetails?.user;
        if (!user || user.role !== RolesEnum.PROVIDER) {
            setLoading(false);
            return;
        }
        const userId = user.id;

        async function fetchCalendar() {
            try {
                setLoading(true);
                setError(null);
                const providerProfile = await getProviderByUser(userId);
                setProvider(providerProfile);
                await loadCalendar(providerProfile._id);
            } catch (requestError) {
                setError(getErrorMessage(requestError, "Unable to load the calendar."));
            } finally {
                setLoading(false);
            }
        }

        void fetchCalendar();
    }, [authDetails]);

    function selectDate(dateKey: string) {
        setSelectedDate(dateKey);
        setSelectedItem(null);
        setForm((current) => ({ ...current, date: dateKey }));
    }

    function changeMonth(offset: number) {
        setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    }

    async function saveUnavailability(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!provider || form.startTime >= form.endTime) {
            setError("End time must be later than start time.");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            const body = {
                provider: provider._id,
                date: form.date,
                startTime: Number(form.startTime),
                endTime: Number(form.endTime),
                reason: form.reason.trim() || undefined,
            };

            if (selectedItem?.type === "unavailability") {
                await apiService(
                    HTTP_METHODS_ENUM.patch,
                    buildEndpoint(ENDPOINT_ENUM.UNAVAILABILITY_BY_ID, {
                        id: selectedItem.item._id,
                    }),
                    body,
                );
            } else {
                await apiService(
                    HTTP_METHODS_ENUM.post,
                    ENDPOINT_ENUM.UNAVAILABILITY,
                    body,
                );
            }

            await loadCalendar(provider._id);
            selectDate(form.date);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Unable to save unavailability."));
        } finally {
            setSaving(false);
        }
    }

    function editUnavailability(slot: UnavailabilityRecord) {
        setForm({
            date: getApiDate(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            reason: slot.reason ?? "",
        });
        setSelectedItem({ type: "unavailability", item: slot });
    }

    if (authDetails?.user.role !== RolesEnum.PROVIDER) {
        return (
            <Card>
                <CardContent className="pt-6">Provider access required.</CardContent>
            </Card>
        );
    }

    const selectedDateLabel = getDateFromKey(selectedDate).toLocaleDateString(
        undefined,
        { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">Job Calendar</CardTitle>
                        <CardDescription>
                            Select a date to view jobs and provider unavailability.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => changeMonth(-1)}>
                            Previous
                        </Button>
                        <CardTitle className="min-w-36 text-center">
                            {month.toLocaleDateString(undefined, {
                                month: "long",
                                year: "numeric",
                            })}
                        </CardTitle>
                        <Button variant="outline" onClick={() => changeMonth(1)}>
                            Next
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-7 gap-px bg-border">
                            {days.map((day) => (
                                <Skeleton className="h-28 rounded-none" key={toDateKey(day)} />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="grid grid-cols-7 gap-px bg-border">
                                    {WEEKDAYS.map((weekday) => (
                                        <div className="bg-muted p-2 text-center text-xs font-medium" key={weekday}>
                                            {weekday}
                                        </div>
                                    ))}
                                    {days.map((day) => {
                                        const dateKey = toDateKey(day);
                                        const data = calendarData[dateKey] ?? EMPTY_DATE_DATA;
                                        const isSelected = dateKey === selectedDate;
                                        const isCurrentMonth = day.getMonth() === month.getMonth();

                                        return (
                                            <button
                                                className={`min-h-28 bg-background p-2 text-left align-top transition hover:bg-muted/60 ${
                                                    isSelected ? "ring-2 ring-primary ring-inset" : ""
                                                } ${isCurrentMonth ? "" : "text-muted-foreground"}`}
                                                key={dateKey}
                                                onClick={() => selectDate(dateKey)}
                                                type="button"
                                            >
                                                <div className="mb-2 text-sm font-medium">
                                                    {day.getDate()}
                                                </div>
                                                <div className="space-y-1">
                                                    {data.jobs.map((job) => (
                                                        <div
                                                            className="truncate rounded bg-primary px-1.5 py-1 text-xs text-primary-foreground"
                                                            key={job._id}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setSelectedItem({ type: "job", item: job });
                                                                setSelectedDate(dateKey);
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            {formatTime(job.startTime)} {getServiceName(job)}
                                                        </div>
                                                    ))}
                                                    {data.unavailability.map((slot) => (
                                                        <div
                                                            className="truncate rounded border border-amber-300 bg-amber-100 px-1.5 py-1 text-xs text-amber-900"
                                                            key={slot._id}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setSelectedItem({
                                                                    type: "unavailability",
                                                                    item: slot,
                                                                });
                                                                setSelectedDate(dateKey);
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            {formatTime(slot.startTime)} Unavailable
                                                        </div>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{selectedDateLabel}</CardTitle>
                    <CardDescription>
                        {selectedDateData.jobs.length} job(s), {selectedDateData.unavailability.length} unavailable slot(s)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && <p className="text-destructive">{error}</p>}
                    {selectedDateData.jobs.length === 0 && selectedDateData.unavailability.length === 0 && (
                        <p className="text-muted-foreground">No jobs or unavailability on this day.</p>
                    )}

                    {selectedItem?.type === "job" && (
                        <Card className="border-primary/30 bg-primary/5" size="sm">
                            <CardHeader>
                                <CardTitle>Job details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <p><strong>Service:</strong> {getServiceName(selectedItem.item)}</p>
                                <p><strong>Customer:</strong> {getCustomerName(selectedItem.item)}</p>
                                <p><strong>Time:</strong> {formatTime(selectedItem.item.startTime)} - {formatTime(selectedItem.item.endTime)}</p>
                                <p><strong>Status:</strong> {selectedItem.item.status.replace("_", " ")}</p>
                            </CardContent>
                        </Card>
                    )}

                    {selectedItem?.type === "unavailability" && (
                        <Card className="border-amber-300 bg-amber-50" size="sm">
                            <CardHeader>
                                <CardTitle>Unavailability details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>Time:</strong> {formatTime(selectedItem.item.startTime)} - {formatTime(selectedItem.item.endTime)}</p>
                                <p><strong>Reason:</strong> {selectedItem.item.reason || "Not specified"}</p>
                                <Button variant="outline" onClick={() => editUnavailability(selectedItem.item)}>
                                    Edit unavailability
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />
                    <form className="space-y-4" onSubmit={saveUnavailability}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">
                                    {selectedItem?.type === "unavailability"
                                        ? "Edit unavailability"
                                        : "Add unavailability"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Block a time interval on your provider calendar.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="unavailability-date">Date</Label>
                                <Input
                                    id="unavailability-date"
                                    type="date"
                                    value={form.date}
                                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unavailability-start">Start time</Label>
                                <Input
                                    id="unavailability-start"
                                    min="0"
                                    max="1439"
                                    type="number"
                                    value={form.startTime}
                                    onChange={(event) => setForm({ ...form, startTime: Number(event.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unavailability-end">End time</Label>
                                <Input
                                    id="unavailability-end"
                                    min="0"
                                    max="1439"
                                    type="number"
                                    value={form.endTime}
                                    onChange={(event) => setForm({ ...form, endTime: Number(event.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unavailability-reason">Reason</Label>
                            <Input
                                id="unavailability-reason"
                                placeholder="Optional reason"
                                value={form.reason}
                                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                            />
                        </div>
                        <Button disabled={saving || loading} type="submit">
                            {saving ? "Saving..." : selectedItem?.type === "unavailability" ? "Save changes" : "Add unavailability"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
