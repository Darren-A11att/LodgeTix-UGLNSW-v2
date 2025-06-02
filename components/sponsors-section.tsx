import Image from "next/image"

const sponsors = [
  {
    name: "United Grand Lodge of NSW & ACT",
    logo: "/placeholder.svg?height=48&width=158&text=UGL"
  },
  {
    name: "Masonic Care NSW",
    logo: "/placeholder.svg?height=48&width=158&text=Care"
  },
  {
    name: "Freemasons Foundation",
    logo: "/placeholder.svg?height=48&width=158&text=Foundation"
  },
  {
    name: "Royal Arch Chapter",
    logo: "/placeholder.svg?height=48&width=158&text=Royal+Arch"
  },
  {
    name: "Mark Master Masons",
    logo: "/placeholder.svg?height=48&width=158&text=Mark"
  }
];

export function SponsorsSection() {
  return (
    <div className="bg-gray-100 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-lg/8 font-semibold text-masonic-navy">
          Proudly supported by Masonic organizations across NSW & ACT
        </h2>
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          {sponsors.map((sponsor, index) => (
            <div
              key={sponsor.name}
              className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
            >
              <Image
                alt={sponsor.name}
                src={sponsor.logo}
                width={158}
                height={48}
                className="h-12 w-full object-contain filter brightness-0 opacity-60 hover:opacity-80 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}