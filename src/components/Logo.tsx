export function Logo() {
  return (
    <span className="block w-40 md:w-48">
      <img
        src="/Blackandgreenlogo.png"
        alt="ShopEx Studio"
        width={2036}
        height={716}
        className="block h-auto w-full dark:hidden"
      />
      <img
        src="/Whiteandlimelogo.png"
        alt="ShopEx Studio"
        width={2035}
        height={716}
        className="hidden h-auto w-full dark:block"
      />
    </span>
  );
}
