import ipaddress
import re


class IOCValidator:

    @staticmethod
    def validate_ip(ip: str) -> bool:
        """
        Validate whether the given string is a valid IPv4 or IPv6 address.
        """
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_domain(domain: str) -> bool:
        """
        Validate whether the given string is a valid domain name.
        """
        pattern = (
            r"^(?!-)"
            r"(?:[A-Za-z0-9-]{1,63}\.)+"
            r"[A-Za-z]{2,63}$"
        )

        return re.match(pattern, domain) is not None