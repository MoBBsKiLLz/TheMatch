import EditScreenInfo from '@/components/EditScreenInfo';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function Players() {
  return (
    <Center className="flex-1">
      <Heading className="font-bold text-2xl">Players</Heading>
      <Divider className="my-[30px] w-[80%]" />
      <Text className="p-4">This is where you will see the list of players. It is located in "app/(tabs)/players/index.tsx".</Text>
      <EditScreenInfo path="app/(app)/(tabs)/players.tsx" />
    </Center>
  );
}
