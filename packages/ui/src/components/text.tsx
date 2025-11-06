import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";



export const H1 = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
      className
    )}
    {...props}
  >
    {children}
  </h1>
));
H1.displayName = "H1";

export const H2 = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0",
      className
    )}
    {...props}
  >
    {children}
  </h2>
));
H2.displayName = "H2";

export const H3 = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "scroll-m-20 text-2xl font-semibold tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
H3.displayName = "H3";

export const H4 = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn(
      "scroll-m-20 text-xl font-semibold tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h4>
));
H4.displayName = "H4";

export const P = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("leading-7", className)}
    {...props}
  >
    {children}
  </p>
));
P.displayName = "P";

export const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  React.HTMLAttributes<HTMLQuoteElement>
>(({ className, children, ...props }, ref) => (
  <blockquote
    ref={ref}
    className={cn("mt-6 border-l-2 pl-6 italic", className)}
    {...props}
  >
    {children}
  </blockquote>
));
Blockquote.displayName = "Blockquote";

export const List = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, children, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
    {...props}
  >
    {children}
  </ul>
));
List.displayName = "List";

export const InlineCode = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <code
    ref={ref}
    className={cn(
      "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      className
    )}
    {...props}
  >
    {children}
  </code>
));
InlineCode.displayName = "InlineCode";

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, href, onClick, ...props }, ref) => {
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
          e.preventDefault(); // so you can handle navigation manually
          onClick(e);
        }
      },
      [onClick]
    );

    return (
      <a
        ref={ref}
        href={href}
        onClick={onClick ? handleClick : undefined}
        className={cn(
          "font-medium underline underline-offset-4 transition-colors text-primary hover:text-primary/80",
          className
        )}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";