import { useSelector } from "react-redux";
import type { RootState } from "../../store";
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
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

// "Shri Manager" -> "SM"
const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export default function ManagerProfile() {
  const { userInfo, managerInfo, regions, selectedRegionId, pending } =
    useSelector((state: RootState) => state.manager);
  const loading = pending > 0 && !userInfo;
  const region = regions.find((r) => r._id === selectedRegionId);

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

      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal Information</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input id="full-name" value={userInfo?.name ?? ""} readOnly required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email-address">Email Address</FieldLabel>
                <Input id="email-address" value={userInfo?.email ?? ""} readOnly required />
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
            <Button type="submit">Save Changes</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}

