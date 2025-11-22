import EditScreenInfo from '@/components/EditScreenInfo';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function Matches() {
  return (
    <Center className="flex-1">
      <Heading className="font-bold text-2xl">Matches</Heading>
      <Divider className="my-[30px] w-[80%]" />
      <Text className="p-4">You will see the list of matches here. It is located in "app/(tabs)/matches/index.tsx".</Text>
      <EditScreenInfo path="app/(app)/(tabs)/matches.tsx" />
    </Center>
  );
}
