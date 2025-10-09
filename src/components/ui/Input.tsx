import React from 'react';

interface InputProps {
    type?: string;
    placeholder?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    value: string;
}

const Input: React.FC<InputProps> = ({ type = 'text', placeholder, onChange, value }) => {
    return (
        <input
            type={type}
            placeholder={placeholder}
            onChange={onChange}
            value={value}
            className="border rounded p-2"
        />
    );
};

export default Input;