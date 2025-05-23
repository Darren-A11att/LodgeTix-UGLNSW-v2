import { AboutValue } from '@/lib/services/content-service';

interface AboutValuesProps {
  values: AboutValue[];
}

export function AboutValues({ values }: AboutValuesProps) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Our Values</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {values.map((value) => (
          <div key={value.id} className="rounded-lg border p-6">
            <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
            <p className="text-gray-600">{value.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}