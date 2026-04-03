type CanvasProps = {
  size: number;
};

const palette = {
  blush: "#ffa0b2",
  blushSoft: "#ffe0e8",
  bow: "#ff7e8a",
  bowDeep: "#ff6076",
  cream: "#fff7ef",
  creamDeep: "#ffe7d0",
  ear: "#e5b07e",
  ink: "#6d4d3f",
  menu: "#fff9f3",
  mint: "#97d6be",
  peach: "#ffd2bb",
  pink: "#ffe6ee",
  warm: "#ffc5d2",
};

function BearMascot({
  size,
  transparent = false,
}: {
  size: number;
  transparent?: boolean;
}) {
  const headSize = Math.round(size * 0.68);
  const earSize = Math.round(size * 0.23);
  const eyeSize = Math.max(10, Math.round(size * 0.05));
  const cheekSize = Math.round(size * 0.1);
  const muzzleWidth = Math.round(size * 0.28);
  const menuWidth = Math.round(size * 0.3);
  const menuHeight = Math.round(size * 0.24);
  const bowSize = Math.round(size * 0.13);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: transparent
          ? "transparent"
          : "radial-gradient(circle at top, rgba(255,255,255,0.72), rgba(255,255,255,0) 62%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.11),
          left: Math.round(size * 0.17),
          width: earSize,
          height: earSize,
          borderRadius: 999,
          background: palette.ear,
          border: `${Math.max(6, Math.round(size * 0.018))}px solid ${palette.ink}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.11),
          right: Math.round(size * 0.17),
          width: earSize,
          height: earSize,
          borderRadius: 999,
          background: palette.ear,
          border: `${Math.max(6, Math.round(size * 0.018))}px solid ${palette.ink}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.1),
          right: Math.round(size * 0.17),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: bowSize * 2,
          height: bowSize,
          transform: "rotate(18deg)",
        }}
      >
        <div
          style={{
            width: bowSize,
            height: bowSize,
            borderRadius: `${bowSize}px ${bowSize}px ${Math.round(bowSize * 0.35)}px ${Math.round(
              bowSize * 0.35,
            )}px`,
            background: palette.bow,
            border: `${Math.max(4, Math.round(size * 0.012))}px solid ${palette.ink}`,
            transform: "rotate(-18deg)",
          }}
        />
        <div
          style={{
            width: Math.round(bowSize * 0.62),
            height: Math.round(bowSize * 0.62),
            borderRadius: 999,
            background: palette.bowDeep,
            border: `${Math.max(3, Math.round(size * 0.009))}px solid ${palette.ink}`,
            marginLeft: -Math.round(bowSize * 0.12),
            marginRight: -Math.round(bowSize * 0.12),
          }}
        />
        <div
          style={{
            width: bowSize,
            height: bowSize,
            borderRadius: `${bowSize}px ${bowSize}px ${Math.round(bowSize * 0.35)}px ${Math.round(
              bowSize * 0.35,
            )}px`,
            background: palette.bow,
            border: `${Math.max(4, Math.round(size * 0.012))}px solid ${palette.ink}`,
            transform: "rotate(18deg)",
          }}
        />
      </div>

      <div
        style={{
          width: headSize,
          height: headSize,
          borderRadius: 999,
          background: palette.creamDeep,
          border: `${Math.max(8, Math.round(size * 0.022))}px solid ${palette.ink}`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.26),
            left: Math.round(headSize * 0.24),
            width: eyeSize,
            height: Math.round(eyeSize * 1.25),
            borderRadius: 999,
            background: palette.ink,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.26),
            right: Math.round(headSize * 0.24),
            width: eyeSize,
            height: Math.round(eyeSize * 1.25),
            borderRadius: 999,
            background: palette.ink,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.49),
            width: muzzleWidth,
            height: Math.round(headSize * 0.2),
            borderRadius: 999,
            background: palette.cream,
            border: `${Math.max(4, Math.round(size * 0.01))}px solid ${palette.ink}`,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.51),
            width: Math.round(size * 0.07),
            height: Math.round(size * 0.05),
            borderRadius: 999,
            background: palette.ink,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.64),
            width: Math.round(size * 0.14),
            height: Math.round(size * 0.05),
            borderBottom: `${Math.max(4, Math.round(size * 0.012))}px solid ${palette.ink}`,
            borderRadius: "0 0 999px 999px",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.47),
            left: Math.round(headSize * 0.14),
            width: cheekSize,
            height: cheekSize,
            borderRadius: 999,
            background: palette.blush,
            opacity: 0.72,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: Math.round(headSize * 0.47),
            right: Math.round(headSize * 0.14),
            width: cheekSize,
            height: cheekSize,
            borderRadius: 999,
            background: palette.blush,
            opacity: 0.72,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          right: Math.round(size * 0.1),
          bottom: Math.round(size * 0.12),
          width: menuWidth,
          height: menuHeight,
          borderRadius: Math.round(size * 0.08),
          background: palette.menu,
          border: `${Math.max(6, Math.round(size * 0.014))}px solid ${palette.ink}`,
          transform: "rotate(8deg)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: Math.round(size * 0.05),
          gap: Math.round(size * 0.02),
        }}
      >
        <div
          style={{
            width: Math.round(size * 0.15),
            height: Math.round(size * 0.025),
            borderRadius: 999,
            background: palette.mint,
          }}
        />
        <div
          style={{
            width: Math.round(size * 0.12),
            height: Math.round(size * 0.025),
            borderRadius: 999,
            background: palette.peach,
          }}
        />
        <div
          style={{
            width: Math.round(size * 0.09),
            height: Math.round(size * 0.025),
            borderRadius: 999,
            background: palette.blush,
          }}
        />
      </div>
    </div>
  );
}

export function BrandIconCanvas({ size }: CanvasProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: Math.round(size * 0.28),
        background:
          "linear-gradient(160deg, rgb(255, 231, 238) 0%, rgb(255, 243, 230) 48%, rgb(255, 212, 187) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.08),
          top: Math.round(size * 0.1),
          width: Math.round(size * 0.22),
          height: Math.round(size * 0.22),
          borderRadius: 999,
          background: "rgba(255,255,255,0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -Math.round(size * 0.06),
          top: Math.round(size * 0.12),
          width: Math.round(size * 0.34),
          height: Math.round(size * 0.34),
          borderRadius: 999,
          background: "rgba(255, 160, 178, 0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -Math.round(size * 0.08),
          bottom: -Math.round(size * 0.06),
          width: Math.round(size * 0.3),
          height: Math.round(size * 0.3),
          borderRadius: 999,
          background: "rgba(151, 214, 190, 0.24)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.17),
          left: Math.round(size * 0.18),
          width: Math.round(size * 0.08),
          height: Math.round(size * 0.08),
          transform: "rotate(-12deg)",
          background: palette.bow,
          borderRadius: "80% 80% 0 80%",
        }}
      />

      <div
        style={{
          width: Math.round(size * 0.78),
          height: Math.round(size * 0.78),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          background: "rgba(255,255,255,0.36)",
        }}
      >
        <BearMascot size={Math.round(size * 0.62)} />
      </div>
    </div>
  );
}

export function BrandForegroundCanvas({ size }: CanvasProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <BearMascot size={Math.round(size * 0.82)} transparent />
    </div>
  );
}

export function BrandSplashCanvas({ size }: CanvasProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgb(255, 241, 245) 0%, rgb(255, 248, 239) 54%, rgb(255, 228, 208) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.08),
          left: Math.round(size * 0.1),
          width: Math.round(size * 0.28),
          height: Math.round(size * 0.14),
          borderRadius: 999,
          background: "rgba(255,255,255,0.75)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.13),
          left: Math.round(size * 0.22),
          width: Math.round(size * 0.14),
          height: Math.round(size * 0.1),
          borderRadius: 999,
          background: "rgba(255,255,255,0.9)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: Math.round(size * 0.08),
          top: Math.round(size * 0.1),
          width: Math.round(size * 0.24),
          height: Math.round(size * 0.24),
          borderRadius: 999,
          background: "rgba(255, 160, 178, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.round(size * 0.07),
          bottom: Math.round(size * 0.08),
          width: Math.round(size * 0.28),
          height: Math.round(size * 0.28),
          borderRadius: 999,
          background: "rgba(151, 214, 190, 0.2)",
        }}
      />

      <div
        style={{
          width: Math.round(size * 0.72),
          height: Math.round(size * 0.72),
          borderRadius: Math.round(size * 0.12),
          background: "rgba(255,255,255,0.68)",
          border: `${Math.max(8, Math.round(size * 0.004))}px solid rgba(255,255,255,0.9)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: Math.round(size * 0.34),
            height: Math.round(size * 0.34),
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.72)",
          }}
        >
          <BearMascot size={Math.round(size * 0.26)} />
        </div>

        <div
          style={{
            marginTop: Math.round(size * 0.045),
            padding: `${Math.round(size * 0.012)}px ${Math.round(size * 0.026)}px`,
            borderRadius: 999,
            background: palette.blushSoft,
            color: palette.bowDeep,
            fontSize: Math.round(size * 0.03),
            fontWeight: 700,
            letterSpacing: Math.round(size * 0.002),
          }}
        >
          cute order app
        </div>

        <div
          style={{
            marginTop: Math.round(size * 0.03),
            fontSize: Math.round(size * 0.09),
            fontWeight: 800,
            color: palette.ink,
            letterSpacing: Math.round(size * 0.004),
          }}
        >
          贝贝点菜
        </div>

        <div
          style={{
            marginTop: Math.round(size * 0.018),
            fontSize: Math.round(size * 0.034),
            color: "#8e6753",
            textAlign: "center",
            maxWidth: Math.round(size * 0.48),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: Math.round(size * 0.006),
          }}
        >
          <div>可爱一点</div>
          <div>点菜更快一点</div>
        </div>
      </div>
    </div>
  );
}
