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
  FieldDescription,
  FieldLabel,
  FieldSeparator,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";

export default function ManagerProfile() {
  return (
    <div>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Avatar>
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{"Manager name"}</ItemTitle>
          <ItemDescription>{"Manager email"}</ItemDescription>
        </ItemContent>
      </Item>

      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal Information</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input id="full-name" value={"manager name"} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email-address">Email Address</FieldLabel>
                <Input id="email-address" value={"manager email"} required />
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
