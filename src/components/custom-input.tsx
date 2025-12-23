"use client";

import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorLogoGroup,
    ModelSelectorName,
    ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
    PromptInput,
    PromptInputActionAddAttachments,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputButton,
    PromptInputFooter,
    type PromptInputMessage,
    PromptInputProvider,
    PromptInputSpeechButton,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
    usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { CheckIcon, GlobeIcon } from "lucide-react";
import { useRef } from "react";





interface CustomPromptInputProps {
    onSubmit: (message: PromptInputMessage) => Promise<void> | void;
    isLoading?: boolean;
}

const CustomPromptInput = ({ onSubmit, isLoading }: CustomPromptInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (message: PromptInputMessage) => {
        const hasText = Boolean(message.text);
        const hasAttachments = Boolean(message.files?.length);

        if (!(hasText || hasAttachments)) {
            return;
        }

        await onSubmit(message);
    };

    const status = isLoading ? "streaming" : "ready";

    return (
        <div className="size-full">
            <PromptInputProvider>
                <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                    <PromptInputAttachments>
                        {(attachment) => <PromptInputAttachment data={attachment} />}
                    </PromptInputAttachments>
                    <PromptInputBody>
                        <PromptInputTextarea ref={textareaRef} />
                    </PromptInputBody>
                    <PromptInputFooter>
                        <PromptInputTools>
                            <PromptInputActionMenu>
                                <PromptInputActionMenuTrigger />
                                <PromptInputActionMenuContent>
                                    <PromptInputActionAddAttachments label="Upload PDF" />
                                </PromptInputActionMenuContent>
                            </PromptInputActionMenu>
                        </PromptInputTools>
                        <PromptInputSubmit status={status} />
                    </PromptInputFooter>
                </PromptInput>
            </PromptInputProvider>
        </div>
    );
};

export default CustomPromptInput;
