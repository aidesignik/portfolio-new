// §5.1 Route timeline markers — origin/return-end are a filled dot with a
// halo, stops/destination/return-start are a white dot with a ring.
export function FilledMarker() {
  return (
    <span
      className="block h-[10px] w-[10px] shrink-0 rounded-full bg-[#18181B]"
      style={{ boxShadow: "0 0 0 3px #F4F4F5" }}
    />
  );
}

export function RingMarker() {
  return (
    <span
      className="block h-[10px] w-[10px] shrink-0 rounded-full bg-white"
      style={{ boxShadow: "inset 0 0 0 2px #18181B" }}
    />
  );
}

export function Connector() {
  return <span className="mt-[2px] w-[1.5px] flex-1 bg-[#E4E4E7]" />;
}
