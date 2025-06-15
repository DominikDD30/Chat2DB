import React, { useState, useEffect } from "react";

interface ColumnTypeSelectProps {
  value: string;
  onChange: (newType: string) => void;
}

const PREDEFINED_VARCHAR_SIZES = [16, 32, 64, 128, 255];
const PREDEFINED_VARCHARS = PREDEFINED_VARCHAR_SIZES.map(
  (n) => `varchar(${n})`
);

export const ColumnTypeSelect: React.FC<ColumnTypeSelectProps> = ({
  value,
  onChange,
}) => {
  const varcharMatch = value.match(/^varchar\((\d+)\)$/i);
  const varcharSize = varcharMatch ? parseInt(varcharMatch[1], 10) : null;
  const normalizedVarchar = varcharSize ? `varchar(${varcharSize})` : "";

  const isVarchar = value.toLowerCase().startsWith("varchar(");
  const isCustomVarchar =
    isVarchar && !PREDEFINED_VARCHAR_SIZES.includes(varcharSize ?? 0);

  const [customSize, setCustomSize] = useState(
    varcharSize?.toString() || "512"
  );

  useEffect(() => {
    if (isCustomVarchar && varcharSize) {
      setCustomSize(varcharSize.toString());
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom-varchar") {
      onChange(`varchar(${customSize})`);
    } else {
      onChange(val);
    }
  };

  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = e.target.value.replace(/\D/g, "");
    setCustomSize(size);
    if (size) {
      onChange(`varchar(${size})`);
    }
  };

  return (
    <>
      {!isCustomVarchar ? (
        <select
          value={PREDEFINED_VARCHARS.includes(normalizedVarchar)
            ? normalizedVarchar
            : value}
          onChange={handleSelectChange}
          className="w-full border rounded px-2 py-1"
        >
          <optgroup label="VARCHAR">
            {PREDEFINED_VARCHARS.map((v) => (
              <option key={v} value={v}>
                {v.toUpperCase()}
              </option>
            ))}
            <option value="custom-varchar">Custom VARCHAR...</option>
          </optgroup>
          <option value="int">INT</option>
          <option value="bigint">BIGINT</option>
          <option value="smallint">SMALLINT</option>
          <option value="float">FLOAT</option>
          <option value="decimal(10,2)">DECIMAL(10,2)</option>
          <option value="text">TEXT</option>
          <option value="date">DATE</option>
          <option value="timestamp">TIMESTAMP</option>
          <option value="bool">BOOL</option>
          <option value="uuid">UUID</option>
          <option value="json">JSON</option>
          <option value="blob">BLOB</option>
        </select>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={() => onChange("varchar(16)")}
            className="border px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            VARCHAR
          </button>
          <input
            type="number"
            min={1}
            className="border rounded px-2 py-1 text-sm w-full"
            value={customSize}
            onChange={handleCustomSizeChange}
            placeholder="Size"
          />
        </div>
      )}
    </>
  );
};
