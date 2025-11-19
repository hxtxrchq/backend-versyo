import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Get,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Registro de usuario con envío de email de verificación
   * Rate limit: 3 intentos por minuto
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  /**
   * POST /auth/login
   * Inicio de sesión con generación de refresh token
   * Rate limit: 5 intentos por minuto para prevenir ataques de fuerza bruta
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  /**
   * GET /auth/verify-email/:token
   * Verificar email del usuario con token único
   * Sin rate limit (token único de un solo uso)
   */
  @Public()
  @SkipThrottle()
  @Get('verify-email/:token')
  verificarEmail(@Param('token') token: string) {
    return this.authService.verificarEmail(token);
  }

  /**
   * POST /auth/forgot-password
   * Solicitar recuperación de contraseña (envía email con token)
   * Rate limit: 3 intentos por minuto
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  solicitarRecuperacion(@Body() data: ForgotPasswordDto) {
    return this.authService.solicitarRecuperacionContrasena(data);
  }

  /**
   * POST /auth/reset-password/:token
   * Restablecer contraseña usando token de recuperación
   * Rate limit: 3 intentos por minuto
   */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  restablecerContrasena(
    @Param('token') token: string,
    @Body() data: ResetPasswordDto,
  ) {
    return this.authService.restablecerContrasena(token, data);
  }

  /**
   * POST /auth/refresh-token
   * Renovar access token usando refresh token
   * Sin rate limit estricto (token único)
   */
  @Public()
  @SkipThrottle()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  renovarToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.renovarAccessToken(refreshToken);
  }

  /**
   * POST /auth/logout
   * Cerrar sesión (revoca refresh token)
   * Sin rate limit (acción de cierre)
   */
  @SkipThrottle()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
